import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/AuthContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModulePage from '../../components/ModulePage.jsx'
import MovementForm from '../../components/MovementForm.jsx'
import { formatMoney, formatNumber } from '../../lib/format'
import { itemName, loadStockItems, UNITS } from '../../lib/stock'

const emptyInsumo = { name: '', unit: 'g', min_quantity: '', notes: '' }

export default function PosicaoEstoque() {
  const { isMaster } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [kind, setKind] = useState('todos')
  const [onlyWithStock, setOnlyWithStock] = useState(false)
  const [search, setSearch] = useState('')
  const [moving, setMoving] = useState(null) // { itemId, type }
  const [editing, setEditing] = useState(null) // item id | 'new'
  const [form, setForm] = useState(emptyInsumo)

  async function load() {
    setLoading(true)
    try { setItems(await loadStockItems()) } catch (err) { alert('Não foi possível carregar o estoque: ' + err.message) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(i =>
      i.active &&
      (kind === 'todos' || i.kind === kind || (kind === 'baixo' && Number(i.min_quantity) > 0 && Number(i.quantity) <= Number(i.min_quantity))) &&
      (!onlyWithStock || Number(i.quantity) !== 0) &&
      (!q || itemName(i).toLowerCase().includes(q) || (i.products?.collection || '').toLowerCase().includes(q))
    )
  }, [items, kind, onlyWithStock, search])

  const totals = useMemo(() => {
    const t = { custo: 0, venda: 0, pecas: 0, insumos: 0, baixo: 0 }
    for (const i of items) {
      if (!i.active) continue
      const q = Math.max(Number(i.quantity) || 0, 0)
      const custo = q * (Number(i.avg_cost) || 0)
      t.custo += custo
      if (i.kind === 'peca') { t.pecas += q; t.venda += q * (Number(i.products?.price) || 0) }
      else t.insumos += custo
      if (Number(i.min_quantity) > 0 && Number(i.quantity) <= Number(i.min_quantity)) t.baixo++
    }
    return t
  }, [items])

  function openNewInsumo() { setForm(emptyInsumo); setEditing('new') }
  function openEdit(i) {
    setForm({ name: i.name || '', unit: i.unit, min_quantity: Number(i.min_quantity) || '', notes: i.notes || '' })
    setEditing(i.id)
  }

  async function saveItem(e) {
    e.preventDefault()
    const it = items.find(x => x.id === editing)
    const payload = { unit: form.unit, min_quantity: Number(form.min_quantity) || 0, notes: form.notes || null }
    if (editing === 'new' || it?.kind === 'insumo') payload.name = form.name.trim()
    const { error } = editing === 'new'
      ? await supabase.from('stock_items').insert({ ...payload, kind: 'insumo' })
      : await supabase.from('stock_items').update(payload).eq('id', editing)
    if (error) return alert('Não foi possível salvar: ' + error.message)
    setEditing(null)
    load()
  }

  async function removeItem() {
    const it = items.find(x => x.id === editing)
    if (!confirm(`Excluir "${itemName(it)}" do estoque? Todo o histórico de movimentações dele também será apagado.`)) return
    const { error } = await supabase.from('stock_items').delete().eq('id', editing)
    if (error) return alert(error.message)
    setEditing(null)
    load()
  }

  const editingItem = items.find(x => x.id === editing)

  return (
    <ModulePage module="estoque" title="Posição do estoque" actions={
      <>
        <button className="ghost" onClick={openNewInsumo}>+ Matéria-prima</button>
        <button onClick={() => setMoving({ itemId: null, type: 'entrada' })}>+ Movimentação</button>
      </>
    }>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Valor em estoque (custo)</div>
          <div className="value">{formatMoney(totals.custo)}</div>
          <div className="sub">{formatMoney(totals.insumos)} em matéria-prima</div>
        </div>
        <div className="stat-card">
          <div className="label">Peças prontas</div>
          <div className="value">{formatNumber(totals.pecas)}</div>
          <div className="sub">valem {formatMoney(totals.venda)} em venda</div>
        </div>
        <div className="stat-card">
          <div className="label">Lucro esperado das peças</div>
          <div className="value">{formatMoney(totals.venda - (totals.custo - totals.insumos))}</div>
          <div className="sub">preço de venda − custo médio</div>
        </div>
        <button type="button" className={`stat-card stat-button${kind === 'baixo' ? ' selected' : ''}`} onClick={() => setKind(kind === 'baixo' ? 'todos' : 'baixo')}>
          <div className="label">Abaixo do mínimo</div>
          <div className="value" style={{ color: totals.baixo ? 'var(--danger)' : undefined }}>{totals.baixo}</div>
          <div className="sub">{totals.baixo ? 'toque para ver' : 'tudo em ordem'}</div>
        </button>
      </div>

      <div className="toolbar">
        <input placeholder="Buscar peça, coleção ou material…" value={search} onChange={e => setSearch(e.target.value)} />
        <select value={kind} onChange={e => setKind(e.target.value)}>
          <option value="todos">Peças e matéria-prima</option>
          <option value="peca">Só peças do catálogo</option>
          <option value="insumo">Só matéria-prima</option>
          <option value="baixo">Abaixo do mínimo</option>
        </select>
        <label className="check">
          <input type="checkbox" checked={onlyWithStock} onChange={e => setOnlyWithStock(e.target.checked)} />
          Só com saldo
        </label>
        <span className="toolbar-count">{visible.length} itens</span>
      </div>

      {loading ? <p>Carregando…</p> : visible.length === 0 ? (
        <div className="empty-state card">Nenhum item com esse filtro.</div>
      ) : (
        <table className="cards-on-phone dense">
          <thead>
            <tr>
              <th></th><th>Item</th><th className="num">Quantidade</th><th className="num">Custo médio</th>
              <th className="num">Total (custo)</th><th className="num">Preço venda</th><th className="num">Total (venda)</th><th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(i => {
              const q = Number(i.quantity) || 0
              const avg = Number(i.avg_cost) || 0
              const price = i.kind === 'peca' ? Number(i.products?.price) || 0 : null
              const low = Number(i.min_quantity) > 0 && q <= Number(i.min_quantity)
              return (
                <tr key={i.id}>
                  <td className="thumb-cell">
                    {i.products?.photo_url
                      ? <img src={i.products.photo_url} alt="" className="thumb" loading="lazy" />
                      : <div className={`thumb thumb-empty kind-${i.kind}`}>{i.kind === 'insumo' ? i.unit : ''}</div>}
                  </td>
                  <td data-label="Item">
                    <strong className="cell-title">{itemName(i)}</strong>
                    <div className="cell-sub">
                      {i.kind === 'peca' ? (i.products?.collection || 'Catálogo') : 'Matéria-prima'}
                      {i.kind === 'peca' && i.products?.status === 'pausado' && ' · pausada no catálogo'}
                    </div>
                  </td>
                  <td data-label="Quantidade" className={`num strong${q < 0 || low ? ' danger-text' : ''}`}>
                    {formatNumber(q)} {i.unit}
                    {low && <div className="cell-sub danger-text">mínimo {formatNumber(i.min_quantity)}</div>}
                  </td>
                  <td data-label="Custo médio" className="num">{avg ? formatMoney(avg) : '—'}</td>
                  <td data-label="Valor total (custo)" className="num">{q && avg ? formatMoney(q * avg) : '—'}</td>
                  <td data-label="Preço de venda" className="num">{price != null ? formatMoney(price) : '—'}</td>
                  <td data-label="Valor total (venda)" className="num">{price && q > 0 ? formatMoney(q * price) : '—'}</td>
                  <td className="actions">
                    <button className="small" onClick={() => setMoving({ itemId: i.id, type: 'entrada' })}>Entrada</button>{' '}
                    <button className="ghost small" onClick={() => setMoving({ itemId: i.id, type: 'saida' })}>Saída</button>{' '}
                    <button className="ghost small" onClick={() => openEdit(i)} title="Configurar">⋯</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {moving && (
        <MovementForm
          items={items}
          initialItemId={moving.itemId}
          initialType={moving.type}
          onClose={() => setMoving(null)}
          onSaved={() => { setMoving(null); load() }}
        />
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nova matéria-prima' : `Configurar: ${itemName(editingItem)}`} onClose={() => setEditing(null)}>
          <form onSubmit={saveItem}>
            {(editing === 'new' || editingItem?.kind === 'insumo') ? (
              <>
                <label>Nome *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Prata 950, Fecho lagosta, Caixinha P" />
              </>
            ) : (
              <p className="hint">Nome, foto e preço desta peça vêm do Catálogo.</p>
            )}
            <div className="row">
              <div>
                <label>Unidade</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{k} ({v})</option>)}
                </select>
              </div>
              <div>
                <label>Estoque mínimo (aviso)</label>
                <input type="number" step="any" min="0" value={form.min_quantity} onChange={e => setForm({ ...form, min_quantity: e.target.value })} placeholder="0 = sem aviso" />
              </div>
            </div>
            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            {editing === 'new' && <p className="hint">Depois de criar, registre uma <strong>Entrada</strong> com a quantidade e o custo.</p>}
            <div className="form-actions">
              <button type="submit">Salvar</button>
              {editing !== 'new' && isMaster && <button type="button" className="ghost danger-text" onClick={removeItem}>Excluir item</button>}
            </div>
          </form>
        </Modal>
      )}
    </ModulePage>
  )
}
