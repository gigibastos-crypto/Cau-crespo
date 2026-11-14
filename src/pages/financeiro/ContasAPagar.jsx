import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../../components/Modal.jsx'
import ModulePage from '../../components/ModulePage.jsx'
import { formatMoney, formatDate, today, addDays, addMonths, PERIODS, periodBounds } from '../../lib/format'
import { PAYMENT_METHODS, categoryName, expenseState, STATE_LABELS, loadFinanceLookups } from '../../lib/finance'

const emptyForm = () => ({
  description: '', supplier_id: '', category_id: '', amount: '', due_date: today(),
  payment_method: '', document_number: '', notes: '', status: 'pendente', paid_at: '', repeat: 1,
})

export default function ContasAPagar() {
  const [expenses, setExpenses] = useState([])
  const [lookups, setLookups] = useState({ categories: [], suppliers: [], categoriesById: {}, suppliersById: {} })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [paying, setPaying] = useState(null)
  const [payForm, setPayForm] = useState({ paid_at: today(), payment_method: '' })

  const [stateFilter, setStateFilter] = useState('abertas')
  const [period, setPeriod] = useState('tudo')
  const [custom, setCustom] = useState({ start: '', end: '' })
  const [supplierFilter, setSupplierFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const [{ data, error }, lk] = await Promise.all([
      supabase.from('expenses').select('*').order('due_date', { ascending: true, nullsFirst: false }),
      loadFinanceLookups(),
    ])
    if (error) alert('Não foi possível carregar as contas: ' + error.message)
    setExpenses(data ?? [])
    setLookups(lk)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const t = today()
  const in7 = addDays(t, 7)
  const { start: monthStart, end: monthEnd } = periodBounds('mes')

  const summary = useMemo(() => {
    const s = { vencidas: 0, nVencidas: 0, semana: 0, nSemana: 0, mes: 0, pagoMes: 0 }
    for (const e of expenses) {
      const v = Number(e.amount || 0)
      if (e.status === 'pago') {
        if (e.paid_at >= monthStart && e.paid_at <= monthEnd) s.pagoMes += v
        continue
      }
      if (e.due_date && e.due_date < t) { s.vencidas += v; s.nVencidas++ }
      else if (e.due_date && e.due_date <= in7) { s.semana += v; s.nSemana++ }
      if (e.due_date >= monthStart && e.due_date <= monthEnd) s.mes += v
    }
    return s
  }, [expenses, t, in7, monthStart, monthEnd])

  const { start, end } = periodBounds(period, custom)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses.filter(e => {
      const st = expenseState(e, t)
      if (stateFilter === 'abertas' && st === 'pago') return false
      if (stateFilter === 'vencidas' && st !== 'vencida') return false
      if (stateFilter === 'semana' && (st === 'pago' || !e.due_date || e.due_date > in7)) return false
      if (stateFilter === 'pagas' && st !== 'pago') return false
      const refDate = e.status === 'pago' && stateFilter === 'pagas' ? e.paid_at : e.due_date
      if (period !== 'tudo' && (!refDate || refDate < start || refDate > end)) return false
      if (supplierFilter && e.supplier_id !== supplierFilter) return false
      if (categoryFilter && e.category_id !== categoryFilter) return false
      if (q) {
        const sup = lookups.suppliersById[e.supplier_id]?.name || ''
        if (![e.description, sup, e.document_number, e.notes].some(v => (v || '').toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [expenses, stateFilter, period, start, end, supplierFilter, categoryFilter, search, lookups, t, in7])

  const visibleTotal = visible.reduce((s, e) => s + Number(e.amount || 0), 0)

  function openNew() {
    setForm(emptyForm())
    setEditing('new')
  }

  function openEdit(e) {
    setForm({
      description: e.description || '', supplier_id: e.supplier_id || '', category_id: e.category_id || '',
      amount: e.amount ?? '', due_date: e.due_date || '', payment_method: e.payment_method || '',
      document_number: e.document_number || '', notes: e.notes || '', status: e.status,
      paid_at: e.paid_at || '', repeat: 1,
    })
    setEditing(e.id)
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const base = {
      description: form.description.trim(),
      supplier_id: form.supplier_id || null,
      category_id: form.category_id || null,
      amount: Number(form.amount) || 0,
      due_date: form.due_date || null,
      payment_method: form.payment_method || null,
      document_number: form.document_number || null,
      notes: form.notes || null,
      status: form.status,
      paid_at: form.status === 'pago' ? (form.paid_at || today()) : null,
    }
    setSaving(true)
    let error
    if (editing === 'new') {
      const n = Math.max(1, Math.min(60, Number(form.repeat) || 1))
      const seriesId = n > 1 ? crypto.randomUUID() : null
      const rows = Array.from({ length: n }, (_, i) => ({
        ...base,
        description: n > 1 ? `${base.description} (${i + 1}/${n})` : base.description,
        due_date: base.due_date && i > 0 ? addMonths(base.due_date, i) : base.due_date,
        status: i === 0 ? base.status : 'pendente',
        paid_at: i === 0 ? base.paid_at : null,
        series_id: seriesId,
      }))
      ;({ error } = await supabase.from('expenses').insert(rows))
    } else {
      ;({ error } = await supabase.from('expenses').update(base).eq('id', editing))
    }
    setSaving(false)
    if (error) return alert('Não foi possível salvar: ' + error.message)
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    const e = expenses.find(x => x.id === id)
    let ids = [id]
    if (e?.series_id) {
      const future = expenses.filter(x => x.series_id === e.series_id && x.status !== 'pago' && (x.due_date || '') >= (e.due_date || ''))
      if (future.length > 1 && confirm(`Esta conta faz parte de uma repetição. Excluir também as próximas ${future.length - 1} parcelas em aberto?\n\nOK = excluir esta e as próximas · Cancelar = escolher de novo`)) {
        ids = future.map(x => x.id)
      } else if (!confirm('Excluir só esta conta?')) return
    } else if (!confirm('Excluir esta conta?')) return
    const { error } = await supabase.from('expenses').delete().in('id', ids)
    if (error) return alert('Não foi possível excluir: ' + error.message)
    setEditing(null)
    load()
  }

  function openPay(e) {
    setPaying(e)
    setPayForm({ paid_at: today(), payment_method: e.payment_method || '' })
  }

  async function confirmPay(ev) {
    ev.preventDefault()
    const { error } = await supabase.from('expenses')
      .update({ status: 'pago', paid_at: payForm.paid_at || today(), payment_method: payForm.payment_method || null })
      .eq('id', paying.id)
    if (error) return alert(error.message)
    setPaying(null)
    load()
  }

  async function reopen(e) {
    if (!confirm('Voltar esta conta para "a pagar"?')) return
    const { error } = await supabase.from('expenses').update({ status: 'pendente', paid_at: null }).eq('id', e.id)
    if (error) return alert(error.message)
    load()
  }

  const set = key => ev => setForm({ ...form, [key]: ev.target.value })
  const activeCategories = lookups.categories.filter(c => c.active || c.id === form.category_id)
  const activeSuppliers = lookups.suppliers.filter(s => s.active || s.id === form.supplier_id)

  return (
    <ModulePage module="financeiro" title="Contas a pagar" actions={<button onClick={openNew}>+ Nova conta</button>}>
      <div className="stat-grid">
        <button type="button" className={`stat-card stat-button${stateFilter === 'vencidas' ? ' selected' : ''}`} onClick={() => { setStateFilter('vencidas'); setPeriod('tudo') }}>
          <div className="label">Vencidas</div>
          <div className="value" style={{ color: summary.vencidas ? 'var(--danger)' : undefined }}>{formatMoney(summary.vencidas)}</div>
          <div className="sub">{summary.nVencidas} conta(s)</div>
        </button>
        <button type="button" className={`stat-card stat-button${stateFilter === 'semana' ? ' selected' : ''}`} onClick={() => { setStateFilter('semana'); setPeriod('tudo') }}>
          <div className="label">Vencem em 7 dias</div>
          <div className="value">{formatMoney(summary.semana)}</div>
          <div className="sub">{summary.nSemana} conta(s)</div>
        </button>
        <div className="stat-card">
          <div className="label">A pagar neste mês</div>
          <div className="value">{formatMoney(summary.mes)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pago neste mês</div>
          <div className="value">{formatMoney(summary.pagoMes)}</div>
        </div>
      </div>

      <div className="toolbar">
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="abertas">Em aberto</option>
          <option value="vencidas">Vencidas</option>
          <option value="semana">Vencem em 7 dias</option>
          <option value="pagas">Pagas</option>
          <option value="todas">Todas</option>
        </select>
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          {Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{k === 'tudo' ? 'Qualquer data' : v}</option>)}
        </select>
        {period === 'personalizado' && (
          <>
            <input type="date" value={custom.start} onChange={e => setCustom({ ...custom, start: e.target.value })} className="date-input" />
            <input type="date" value={custom.end} onChange={e => setCustom({ ...custom, end: e.target.value })} className="date-input" />
          </>
        )}
        <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">Todos os fornecedores</option>
          {lookups.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">Todas as categorias</option>
          {lookups.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input placeholder="Buscar descrição, nº do documento…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <p>Carregando…</p> : visible.length === 0 ? (
        <div className="empty-state card">
          {expenses.length === 0 ? 'Nenhuma conta cadastrada ainda. Clique em "+ Nova conta" para começar.' : 'Nenhuma conta com esse filtro.'}
        </div>
      ) : (
        <>
          <table className="cards-on-phone">
            <thead>
              <tr><th>Vencimento</th><th>Descrição</th><th>Fornecedor</th><th>Categoria</th><th className="num">Valor</th><th>Situação</th><th></th></tr>
            </thead>
            <tbody>
              {visible.map(e => {
                const st = expenseState(e, t)
                const sup = lookups.suppliersById[e.supplier_id]
                return (
                  <tr key={e.id}>
                    <td data-label="Vencimento" className={st === 'vencida' ? 'danger-text strong' : ''}>{formatDate(e.due_date)}</td>
                    <td data-label="Descrição">
                      <strong className="cell-title">{e.description}</strong>
                      {(e.document_number || e.payment_method) && (
                        <div className="cell-sub">{[PAYMENT_METHODS[e.payment_method], e.document_number && `Doc. ${e.document_number}`].filter(Boolean).join(' · ')}</div>
                      )}
                    </td>
                    <td data-label="Fornecedor">{sup?.name || '—'}</td>
                    <td data-label="Categoria">{categoryName(e, lookups.categoriesById)}</td>
                    <td data-label="Valor" className="num strong">{formatMoney(e.amount)}</td>
                    <td data-label="Situação">
                      <span className={`badge state-${st}`}>{STATE_LABELS[st]}</span>
                      {st === 'pago' && e.paid_at && <div className="cell-sub">em {formatDate(e.paid_at)}</div>}
                    </td>
                    <td className="actions">
                      {st !== 'pago'
                        ? <button className="small" onClick={() => openPay(e)}>Pagar</button>
                        : <button className="ghost small" onClick={() => reopen(e)}>Reabrir</button>}{' '}
                      <button className="ghost small" onClick={() => openEdit(e)}>Editar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="table-total">{visible.length} conta(s) · Total: <strong>{formatMoney(visibleTotal)}</strong></p>
        </>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nova conta a pagar' : 'Editar conta'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Descrição *</label>
            <input required value={form.description} onChange={set('description')} placeholder="Ex.: Prata 950 — 200 g" />

            <div className="row">
              <div>
                <label>Fornecedor</label>
                <select value={form.supplier_id} onChange={set('supplier_id')}>
                  <option value="">Sem fornecedor</option>
                  {activeSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label>Categoria</label>
                <select value={form.category_id} onChange={set('category_id')}>
                  <option value="">Sem categoria</option>
                  {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <p className="hint">Fornecedor ou categoria que não está na lista? Cadastre em <Link to="/configuracoes/fornecedores">Configurações</Link>.</p>

            <div className="row">
              <div>
                <label>Valor (R$) *</label>
                <input required type="number" step="0.01" min="0" inputMode="decimal" value={form.amount} onChange={set('amount')} />
              </div>
              <div>
                <label>Vencimento *</label>
                <input required type="date" value={form.due_date} onChange={set('due_date')} />
              </div>
            </div>

            <div className="row">
              <div>
                <label>Forma de pagamento</label>
                <select value={form.payment_method} onChange={set('payment_method')}>
                  <option value="">—</option>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>Nº nota / boleto</label>
                <input value={form.document_number} onChange={set('document_number')} />
              </div>
            </div>

            <div className="row">
              <div>
                <label>Situação</label>
                <select value={form.status} onChange={set('status')}>
                  <option value="pendente">A pagar</option>
                  <option value="pago">Paga</option>
                </select>
              </div>
              <div>
                {form.status === 'pago' ? (
                  <><label>Paga em</label><input type="date" value={form.paid_at || today()} onChange={set('paid_at')} /></>
                ) : editing === 'new' ? (
                  <><label>Repetir todo mês</label>
                    <select value={form.repeat} onChange={set('repeat')}>
                      <option value={1}>Não repetir</option>
                      {[2, 3, 4, 5, 6, 10, 12, 24].map(n => <option key={n} value={n}>{n} meses (parcelas)</option>)}
                    </select></>
                ) : null}
              </div>
            </div>
            {editing === 'new' && Number(form.repeat) > 1 && form.status !== 'pago' && (
              <p className="hint">Vão ser criadas {form.repeat} contas de {formatMoney(form.amount)}, uma por mês, a partir de {formatDate(form.due_date)}.</p>
            )}

            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={set('notes')} />

            <div className="form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              {editing !== 'new' && <button type="button" className="ghost danger-text" onClick={() => handleDelete(editing)}>Excluir</button>}
            </div>
          </form>
        </Modal>
      )}

      {paying && (
        <Modal title="Registrar pagamento" onClose={() => setPaying(null)}>
          <form onSubmit={confirmPay}>
            <p style={{ marginTop: 0 }}><strong>{paying.description}</strong><br />{formatMoney(paying.amount)} · vencimento {formatDate(paying.due_date)}</p>
            <div className="row">
              <div><label>Pago em</label><input type="date" required value={payForm.paid_at} onChange={e => setPayForm({ ...payForm, paid_at: e.target.value })} /></div>
              <div>
                <label>Forma de pagamento</label>
                <select value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })}>
                  <option value="">—</option>
                  {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <button type="submit">Confirmar pagamento</button>
          </form>
        </Modal>
      )}
    </ModulePage>
  )
}
