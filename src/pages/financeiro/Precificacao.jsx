import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../../components/Modal.jsx'
import ModulePage from '../../components/ModulePage.jsx'
import { formatMoney, formatNumber } from '../../lib/format'
import { loadStockItems, itemName } from '../../lib/stock'
import {
  DEFAULT_PRICING, lineCost, costBreakdown, suggestedPrice, marginPct, formatPct, marginClass,
} from '../../lib/pricing'

const newLine = () => ({ key: crypto.randomUUID(), stock_item_id: '', description: '', quantity: 1, unit: 'un', unit_cost: '' })

export default function Precificacao() {
  const [products, setProducts] = useState([])
  const [costs, setCosts] = useState({})
  const [pricingById, setPricingById] = useState({})
  const [sales, setSales] = useState({})
  const [stock, setStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyMissing, setOnlyMissing] = useState(false)

  const [editing, setEditing] = useState(null) // produto
  const [lines, setLines] = useState([])
  const [pricing, setPricing] = useState(DEFAULT_PRICING)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [{ data: prods, error }, { data: c }, { data: pr }, { data: items }, st] = await Promise.all([
        supabase.from('products').select('id, name, collection, price, photo_url, status').order('name'),
        supabase.rpc('product_costs'),
        supabase.from('product_pricing').select('*'),
        supabase.from('order_items').select('product_id, unit_price, quantity, unit_cost, orders(status)').not('product_id', 'is', null),
        loadStockItems(),
      ])
      if (error) throw error
      setProducts(prods ?? [])
      setCosts(Object.fromEntries((c ?? []).map(r => [r.product_id, r.cost == null ? null : Number(r.cost)])))
      setPricingById(Object.fromEntries((pr ?? []).map(r => [r.product_id, r])))
      const s = {}
      for (const i of items ?? []) {
        if (i.orders?.status === 'cancelado') continue
        const t = s[i.product_id] || (s[i.product_id] = { qty: 0, revenue: 0, cost: 0, costQty: 0, costRevenue: 0 })
        const q = Number(i.quantity) || 0
        const rev = q * (Number(i.unit_price) || 0)
        t.qty += q
        t.revenue += rev
        if (i.unit_cost != null) { t.cost += q * Number(i.unit_cost); t.costRevenue += rev; t.costQty += q }
      }
      setSales(s)
      setStock(st)
    } catch (err) {
      alert('Não foi possível carregar a precificação: ' + err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const stockById = useMemo(() => Object.fromEntries(stock.map(s => [s.id, s])), [stock])
  const insumos = stock.filter(s => s.kind === 'insumo' && s.active)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p =>
      (!onlyMissing || costs[p.id] == null) &&
      (!q || p.name.toLowerCase().includes(q) || (p.collection || '').toLowerCase().includes(q))
    )
  }, [products, costs, search, onlyMissing])

  const withCost = products.filter(p => costs[p.id] != null).length

  // ---------- ficha de custo ----------
  async function openSheet(p) {
    const [{ data: its }, last] = await Promise.all([
      supabase.from('product_cost_items').select('*').eq('product_id', p.id).order('position'),
      Promise.resolve(Object.values(pricingById).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))[0]),
    ])
    const pr = pricingById[p.id]
    setPricing(pr
      ? { labor_hours: pr.labor_hours ?? '', hourly_rate: pr.hourly_rate ?? '', target_margin: pr.target_margin, fees_pct: pr.fees_pct, notes: pr.notes || '' }
      // ficha nova: começa com o valor da hora, margem e taxas da última ficha salva
      : { ...DEFAULT_PRICING, ...(last ? { hourly_rate: last.hourly_rate, target_margin: last.target_margin, fees_pct: last.fees_pct } : {}) })
    setLines((its ?? []).length
      ? its.map(i => ({ key: i.id, stock_item_id: i.stock_item_id || '', description: i.description, quantity: i.quantity, unit: i.unit || 'un', unit_cost: i.unit_cost ?? '' }))
      : [newLine()])
    setEditing(p)
  }

  function updateLine(key, patch) {
    setLines(ls => ls.map(l => l.key === key ? { ...l, ...patch } : l))
  }

  function pickStock(key, id) {
    const s = stockById[id]
    updateLine(key, s
      ? { stock_item_id: id, description: itemName(s), unit: s.unit, unit_cost: '' }
      : { stock_item_id: '', unit_cost: '' })
  }

  const breakdown = costBreakdown(lines, pricing, stockById)
  const suggested = suggestedPrice(breakdown.total, pricing.target_margin, pricing.fees_pct)
  const currentMargin = editing ? marginPct(editing.price, breakdown.total, pricing.fees_pct) : null
  const rounded = suggested ? Math.ceil(suggested / 5) * 5 : null

  async function saveSheet(applyPrice) {
    setSaving(true)
    const pid = editing.id
    const rows = lines
      .filter(l => l.description.trim() || l.stock_item_id)
      .map((l, i) => ({
        product_id: pid,
        stock_item_id: l.stock_item_id || null,
        description: (l.description || itemName(stockById[l.stock_item_id] || {})).trim(),
        quantity: Number(l.quantity) || 0,
        unit: l.unit || null,
        unit_cost: l.unit_cost === '' ? null : Number(l.unit_cost),
        position: i,
      }))
    const steps = [
      () => supabase.from('product_pricing').upsert({
        product_id: pid,
        labor_hours: Number(pricing.labor_hours) || 0,
        hourly_rate: Number(pricing.hourly_rate) || 0,
        target_margin: Number(pricing.target_margin) || 0,
        fees_pct: Number(pricing.fees_pct) || 0,
        notes: pricing.notes || null,
        updated_at: new Date().toISOString(),
      }),
      () => supabase.from('product_cost_items').delete().eq('product_id', pid),
      () => rows.length ? supabase.from('product_cost_items').insert(rows) : { error: null },
    ]
    if (applyPrice) steps.push(() => supabase.from('products').update({ price: applyPrice }).eq('id', pid))
    for (const step of steps) {
      const { error } = await step()
      if (error) { setSaving(false); return alert('Não foi possível salvar: ' + error.message) }
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  const setP = key => e => setPricing({ ...pricing, [key]: e.target.value })

  return (
    <ModulePage module="financeiro" title="Precificação">
      <p className="intro">
        Monte a ficha de custo de cada peça (materiais e horas de trabalho) para ver o preço sugerido.
        Cada venda guarda o custo do dia, então dá para ver a margem real do que foi vendido.
      </p>

      <div className="toolbar">
        <input placeholder="Buscar peça ou coleção…" value={search} onChange={e => setSearch(e.target.value)} />
        <label className="check">
          <input type="checkbox" checked={onlyMissing} onChange={e => setOnlyMissing(e.target.checked)} />
          Só peças sem ficha
        </label>
        <span className="toolbar-count">{withCost} de {products.length} com ficha</span>
      </div>

      {loading ? <p>Carregando…</p> : visible.length === 0 ? (
        <div className="empty-state card">Nenhuma peça com esse filtro.</div>
      ) : (
        <table className="cards-on-phone dense">
          <thead>
            <tr>
              <th></th><th>Peça</th><th className="num">Custo</th><th className="num">Preço sugerido</th>
              <th className="num">Preço no catálogo</th><th className="num">Margem</th><th className="num">Vendas</th><th></th>
            </tr>
          </thead>
          <tbody>
            {visible.map(p => {
              const cost = costs[p.id]
              const pr = pricingById[p.id]
              const fees = pr?.fees_pct || 0
              const sug = cost != null ? suggestedPrice(cost, pr?.target_margin ?? 50, fees) : null
              const m = marginPct(p.price, cost, fees)
              const s = sales[p.id]
              const realM = s?.costRevenue ? ((s.costRevenue * (1 - fees / 100) - s.cost) / s.costRevenue) * 100 : null
              return (
                <tr key={p.id}>
                  <td className="thumb-cell">
                    {p.photo_url ? <img src={p.photo_url} alt="" className="thumb" loading="lazy" /> : <div className="thumb thumb-empty" />}
                  </td>
                  <td data-label="Item">
                    <strong className="cell-title">{p.name}</strong>
                    <div className="cell-sub">{p.collection || 'Catálogo'}{p.status === 'pausado' && ' · pausada'}</div>
                  </td>
                  <td data-label="Custo" className="num">{cost != null ? formatMoney(cost) : <span className="cell-sub">sem ficha</span>}</td>
                  <td data-label="Preço sugerido" className="num">{sug ? formatMoney(sug) : '—'}</td>
                  <td data-label="Preço no catálogo" className="num strong">{formatMoney(p.price)}</td>
                  <td data-label="Margem" className={`num strong ${marginClass(m, (pr?.target_margin ?? 50) * 0.8)}`}>{formatPct(m)}</td>
                  <td data-label="Vendas" className="num">
                    {s?.qty ? <>{formatNumber(s.qty)} un. · média {formatMoney(s.revenue / s.qty)}</> : '—'}
                    {realM != null && <div className={`cell-sub ${marginClass(realM)}`}>margem real {formatPct(realM)}</div>}
                  </td>
                  <td className="actions">
                    <button className={cost != null ? 'ghost small' : 'small'} onClick={() => openSheet(p)}>
                      {cost != null ? 'Ficha de custo' : 'Montar ficha'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={`Ficha de custo: ${editing.name}`} onClose={() => setEditing(null)}>
          <form onSubmit={e => { e.preventDefault(); saveSheet(null) }}>
            <label>Materiais e outros custos</label>
            <p className="hint">Escolha um material do estoque (usa o custo médio atual) ou digite outro custo: embalagem, banho, fotografia…</p>
            {lines.map(l => {
              const s = stockById[l.stock_item_id]
              return (
                <div key={l.key} className="cost-line">
                  <select value={l.stock_item_id} onChange={e => pickStock(l.key, e.target.value)}>
                    <option value="">Outro custo (digitar)</option>
                    {insumos.map(i => <option key={i.id} value={i.id}>{itemName(i)} ({i.unit})</option>)}
                  </select>
                  {!l.stock_item_id && (
                    <input placeholder="Descrição (ex.: caixinha, banho de ouro)" value={l.description}
                      onChange={e => updateLine(l.key, { description: e.target.value })} />
                  )}
                  <div className="cost-line-nums">
                    <label>Qtd ({l.unit})<input type="number" step="any" min="0" inputMode="decimal" value={l.quantity}
                      onChange={e => updateLine(l.key, { quantity: e.target.value })} /></label>
                    <label>Custo por {l.unit} (R$)<input type="number" step="any" min="0" inputMode="decimal" value={l.unit_cost}
                      placeholder={s ? String(Number(s.avg_cost || 0).toFixed(2)) : ''}
                      onChange={e => updateLine(l.key, { unit_cost: e.target.value })} /></label>
                    <span className="cost-line-total">{formatMoney(lineCost(l, stockById))}</span>
                    <button type="button" className="ghost small" onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))} title="Remover">×</button>
                  </div>
                </div>
              )
            })}
            <button type="button" className="ghost small" onClick={() => setLines(ls => [...ls, newLine()])} style={{ marginBottom: 14 }}>+ Adicionar custo</button>

            <div className="row">
              <div><label>Horas de trabalho</label><input type="number" step="any" min="0" inputMode="decimal" value={pricing.labor_hours} onChange={setP('labor_hours')} placeholder="Ex.: 1,5" /></div>
              <div><label>Valor da sua hora (R$)</label><input type="number" step="0.01" min="0" inputMode="decimal" value={pricing.hourly_rate} onChange={setP('hourly_rate')} /></div>
            </div>
            <div className="row">
              <div><label>Margem desejada (%)</label><input type="number" step="any" min="0" max="95" inputMode="decimal" value={pricing.target_margin} onChange={setP('target_margin')} /></div>
              <div><label>Taxas: cartão, impostos (%)</label><input type="number" step="any" min="0" max="60" inputMode="decimal" value={pricing.fees_pct} onChange={setP('fees_pct')} /></div>
            </div>

            <div className="price-summary">
              <div><span>Materiais</span><strong>{formatMoney(breakdown.materials)}</strong></div>
              <div><span>Mão de obra</span><strong>{formatMoney(breakdown.labor)}</strong></div>
              <div className="total"><span>Custo total</span><strong>{formatMoney(breakdown.total)}</strong></div>
              <div className="big"><span>Preço sugerido</span><strong>{suggested ? formatMoney(suggested) : '—'}</strong></div>
              <div><span>Preço no catálogo hoje</span><strong>{formatMoney(editing.price)} <span className={marginClass(currentMargin, Number(pricing.target_margin) * 0.8)}>· margem {formatPct(currentMargin)}</span></strong></div>
            </div>
            {suggested == null && breakdown.total > 0 && <p className="hint danger-text">Margem + taxas precisam somar menos de 100%.</p>}

            <label>Observações</label>
            <textarea rows={2} value={pricing.notes} onChange={setP('notes')} />

            <div className="form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar ficha'}</button>
              {rounded && Number(editing.price) !== rounded && (
                <button type="button" className="ghost" disabled={saving}
                  onClick={() => confirm(`Salvar a ficha e mudar o preço de "${editing.name}" no catálogo de ${formatMoney(editing.price)} para ${formatMoney(rounded)}?`) && saveSheet(rounded)}>
                  Salvar e usar {formatMoney(rounded)} no catálogo
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </ModulePage>
  )
}
