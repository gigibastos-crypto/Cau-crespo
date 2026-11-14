import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../../components/Modal.jsx'
import ModulePage from '../../components/ModulePage.jsx'
import { formatMoney } from '../../lib/format'

const empty = {
  name: '', supplies: '', document: '', contact_name: '', phone: '', email: '',
  website: '', pix_key: '', bank_info: '', notes: '', active: true,
}

function whatsappLink(phone) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length < 10) return null
  return `https://wa.me/${digits.length <= 11 ? '55' + digits : digits}`
}

export default function Fornecedores() {
  const [suppliers, setSuppliers] = useState([])
  const [spent, setSpent] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data, error }, { data: exp }] = await Promise.all([
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('expenses').select('supplier_id, amount, status').not('supplier_id', 'is', null),
    ])
    if (error) alert('Não foi possível carregar os fornecedores: ' + error.message)
    setSuppliers(data ?? [])
    const totals = {}
    for (const e of exp ?? []) {
      const t = totals[e.supplier_id] || (totals[e.supplier_id] = { pago: 0, aberto: 0 })
      if (e.status === 'pago') t.pago += Number(e.amount || 0)
      else t.aberto += Number(e.amount || 0)
    }
    setSpent(totals)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return suppliers.filter(s =>
      (showInactive || s.active) &&
      (!q || [s.name, s.supplies, s.contact_name, s.document, s.email].some(v => (v || '').toLowerCase().includes(q)))
    )
  }, [suppliers, search, showInactive])

  function openNew() { setForm(empty); setEditing('new') }

  function openEdit(s) {
    const clean = {}
    for (const k of Object.keys(empty)) clean[k] = s[k] ?? empty[k]
    setForm(clean)
    setEditing(s.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, name: form.name.trim() }
    setSaving(true)
    const { error } = editing === 'new'
      ? await supabase.from('suppliers').insert(payload)
      : await supabase.from('suppliers').update(payload).eq('id', editing)
    setSaving(false)
    if (error) return alert('Não foi possível salvar: ' + error.message)
    setEditing(null)
    load()
  }

  async function handleDelete(s) {
    const t = spent[s.id]
    const msg = t
      ? `"${s.name}" tem contas ligadas a ele. Se excluir, as contas continuam, mas ficam sem fornecedor. Prefere só desativar? (Cancelar = não excluir)`
      : `Excluir o fornecedor "${s.name}"?`
    if (!confirm(msg)) return
    const { error } = await supabase.from('suppliers').delete().eq('id', s.id)
    if (error) return alert('Não foi possível excluir: ' + error.message)
    setEditing(null)
    load()
  }

  const set = key => e => setForm({ ...form, [key]: e.target.value })

  return (
    <ModulePage module="config" title="Fornecedores" actions={<button onClick={openNew}>+ Novo fornecedor</button>}>
      <div className="toolbar">
        <input placeholder="Buscar por nome, o que fornece, contato, CNPJ…" value={search} onChange={e => setSearch(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Mostrar inativos
        </label>
        <span className="toolbar-count">{visible.length} fornecedores</span>
      </div>

      {loading ? <p>Carregando…</p> : visible.length === 0 ? (
        <div className="empty-state card">
          {suppliers.length === 0
            ? 'Nenhum fornecedor cadastrado ainda. Cadastre quem vende prata, madeira, embalagens, serviços…'
            : 'Nenhum fornecedor encontrado com esse filtro.'}
        </div>
      ) : (
        <table className="cards-on-phone">
          <thead>
            <tr><th>Fornecedor</th><th>Fornece</th><th>Contato</th><th className="num">Pago</th><th className="num">Em aberto</th><th></th></tr>
          </thead>
          <tbody>
            {visible.map(s => {
              const t = spent[s.id] || { pago: 0, aberto: 0 }
              const wa = whatsappLink(s.phone)
              return (
                <tr key={s.id} className={s.active ? '' : 'muted-row'}>
                  <td data-label="Fornecedor">
                    <strong className="cell-title">{s.name}</strong>
                    {!s.active && <span className="badge" style={{ marginLeft: 8 }}>Inativo</span>}
                    {s.document && <div className="cell-sub">{s.document}</div>}
                  </td>
                  <td data-label="Fornece">{s.supplies || '—'}</td>
                  <td data-label="Contato">
                    {s.contact_name && <div>{s.contact_name}</div>}
                    {wa ? <a href={wa} target="_blank" rel="noreferrer">{s.phone}</a> : (s.phone || (!s.contact_name && '—'))}
                  </td>
                  <td data-label="Pago" className="num">{formatMoney(t.pago)}</td>
                  <td data-label="Em aberto" className="num">{t.aberto ? formatMoney(t.aberto) : '—'}</td>
                  <td className="actions">
                    <button className="ghost small" onClick={() => openEdit(s)}>Editar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Novo fornecedor' : 'Editar fornecedor'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Nome *</label>
            <input required value={form.name} onChange={set('name')} placeholder="Ex.: Casa da Prata" />
            <label>O que fornece</label>
            <input value={form.supplies} onChange={set('supplies')} placeholder="Ex.: prata 950, fecho, embalagem, fotografia" />
            <div className="row">
              <div><label>CPF / CNPJ</label><input value={form.document} onChange={set('document')} /></div>
              <div><label>Pessoa de contato</label><input value={form.contact_name} onChange={set('contact_name')} /></div>
            </div>
            <div className="row">
              <div><label>WhatsApp / Telefone</label><input value={form.phone} onChange={set('phone')} placeholder="(21) 99999-9999" /></div>
              <div><label>E-mail</label><input type="email" value={form.email} onChange={set('email')} /></div>
            </div>
            <label>Site ou Instagram</label>
            <input value={form.website} onChange={set('website')} />
            <div className="row">
              <div><label>Chave PIX</label><input value={form.pix_key} onChange={set('pix_key')} /></div>
              <div><label>Banco / agência / conta</label><input value={form.bank_info} onChange={set('bank_info')} /></div>
            </div>
            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Prazo de entrega, pedido mínimo, condições…" />
            <label className="check">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
              Fornecedor ativo
            </label>
            <div className="form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              {editing !== 'new' && (
                <button type="button" className="ghost danger-text" onClick={() => handleDelete(suppliers.find(s => s.id === editing))}>Excluir</button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </ModulePage>
  )
}
