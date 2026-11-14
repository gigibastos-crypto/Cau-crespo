import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import ModulePage from '../../components/ModulePage.jsx'
import MovementForm from '../../components/MovementForm.jsx'
import { formatMoney, formatNumber, formatDate, PERIODS, periodBounds } from '../../lib/format'
import { itemName, loadStockItems, MOVE_LABELS } from '../../lib/stock'

export default function Movimentacoes() {
  const [moves, setMoves] = useState([])
  const [items, setItems] = useState([])
  const [suppliers, setSuppliers] = useState({})
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState('')
  const [itemFilter, setItemFilter] = useState('')
  const [period, setPeriod] = useState('mes')
  const [custom, setCustom] = useState({ start: '', end: '' })

  async function load() {
    setLoading(true)
    try {
      const [{ data, error }, its, { data: sups }] = await Promise.all([
        supabase.from('stock_movements').select('*').order('movement_date', { ascending: false }).order('created_at', { ascending: false }).limit(1000),
        loadStockItems(),
        supabase.from('suppliers').select('id, name'),
      ])
      if (error) throw error
      setMoves(data ?? [])
      setItems(its)
      setSuppliers(Object.fromEntries((sups ?? []).map(s => [s.id, s.name])))
    } catch (err) {
      alert('Não foi possível carregar as movimentações: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const itemsById = useMemo(() => Object.fromEntries(items.map(i => [i.id, i])), [items])
  const { start, end } = periodBounds(period, custom)

  const visible = useMemo(() => moves.filter(m =>
    (!type || m.type === type) &&
    (!itemFilter || m.item_id === itemFilter) &&
    (period === 'tudo' || (m.movement_date >= start && m.movement_date <= end))
  ), [moves, type, itemFilter, period, start, end])

  const totalEntradas = visible.filter(m => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity) * Number(m.unit_cost || 0), 0)

  async function remove(m) {
    if (!confirm('Apagar esta movimentação? O saldo e o custo médio do item serão recalculados.')) return
    const { error } = await supabase.from('stock_movements').delete().eq('id', m.id)
    if (error) return alert(error.message)
    load()
  }

  return (
    <ModulePage module="estoque" title="Movimentações" actions={<button onClick={() => setAdding(true)}>+ Movimentação</button>}>
      <div className="toolbar">
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          {Object.entries(PERIODS).filter(([k]) => k !== 'proximo_mes').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {period === 'personalizado' && (
          <>
            <input type="date" className="date-input" value={custom.start} onChange={e => setCustom({ ...custom, start: e.target.value })} />
            <input type="date" className="date-input" value={custom.end} onChange={e => setCustom({ ...custom, end: e.target.value })} />
          </>
        )}
        <select value={type} onChange={e => setType(e.target.value)}>
          <option value="">Entradas, saídas e ajustes</option>
          <option value="entrada">Só entradas</option>
          <option value="saida">Só saídas</option>
          <option value="ajuste">Só ajustes</option>
        </select>
        <select value={itemFilter} onChange={e => setItemFilter(e.target.value)}>
          <option value="">Todos os itens</option>
          {items.map(i => <option key={i.id} value={i.id}>{itemName(i)}</option>)}
        </select>
      </div>

      {loading ? <p>Carregando…</p> : visible.length === 0 ? (
        <div className="empty-state card">Nenhuma movimentação nesse período.</div>
      ) : (
        <>
          <table className="cards-on-phone">
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Item</th><th className="num">Quantidade</th><th className="num">Custo unit.</th><th className="num">Total</th><th>Detalhes</th><th></th></tr>
            </thead>
            <tbody>
              {visible.map(m => {
                const it = itemsById[m.item_id]
                const unit = it?.unit || ''
                const sign = m.type === 'entrada' ? '+' : m.type === 'saida' ? '−' : '='
                return (
                  <tr key={m.id}>
                    <td data-label="Data">{formatDate(m.movement_date)}</td>
                    <td data-label="Tipo"><span className={`badge move-${m.type}`}>{MOVE_LABELS[m.type]}</span></td>
                    <td data-label="Item"><strong className="cell-title">{it ? itemName(it) : '—'}</strong></td>
                    <td data-label="Quantidade" className="num strong">{sign} {formatNumber(m.quantity)} {unit}</td>
                    <td data-label="Custo unit." className="num">{m.unit_cost != null ? formatMoney(m.unit_cost) : '—'}</td>
                    <td data-label="Total" className="num">{m.unit_cost != null ? formatMoney(Number(m.unit_cost) * Number(m.quantity)) : '—'}</td>
                    <td data-label="Detalhes" className="cell-sub">{[suppliers[m.supplier_id], m.reason].filter(Boolean).join(' · ') || '—'}</td>
                    <td className="actions"><button className="ghost small danger-text" onClick={() => remove(m)}>Apagar</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="table-total">{visible.length} movimentação(ões) · Compras/entradas no período: <strong>{formatMoney(totalEntradas)}</strong></p>
        </>
      )}

      {adding && (
        <MovementForm items={items} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />
      )}
    </ModulePage>
  )
}
