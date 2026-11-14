import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import ModulePage from '../../components/ModulePage.jsx'
import { formatMoney, formatDate, today, addDays, PERIODS, periodBounds } from '../../lib/format'
import { categoryName, loadFinanceLookups } from '../../lib/finance'

export default function VisaoGeral() {
  const [orders, setOrders] = useState([])
  const [expenses, setExpenses] = useState([])
  const [lookups, setLookups] = useState({ categoriesById: {}, suppliersById: {} })
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('mes')
  const [custom, setCustom] = useState({ start: '', end: '' })

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('order_date,total_value,material_cost,payment_status,status'),
      supabase.from('expenses').select('*'),
      loadFinanceLookups(),
    ]).then(([{ data: o }, { data: e }, lk]) => {
      setOrders(o ?? [])
      setExpenses(e ?? [])
      setLookups(lk)
      setLoading(false)
    })
  }, [])

  const { start, end } = periodBounds(period, custom)
  const t = today()

  const r = useMemo(() => {
    const inP = d => d && d >= start && d <= end
    const po = orders.filter(o => inP(o.order_date) && o.status !== 'cancelado')
    const revenue = po.filter(o => o.payment_status === 'pago').reduce((s, o) => s + Number(o.total_value || 0), 0)
    const toReceive = po.filter(o => o.payment_status !== 'pago').reduce((s, o) => s + Number(o.total_value || 0), 0)
    const material = po.reduce((s, o) => s + Number(o.material_cost || 0), 0)
    const paid = expenses.filter(e => e.status === 'pago' && inP(e.paid_at))
    const paidTotal = paid.reduce((s, e) => s + Number(e.amount || 0), 0)
    const byCat = {}
    for (const e of paid) {
      const name = categoryName(e, lookups.categoriesById)
      byCat[name] = (byCat[name] || 0) + Number(e.amount || 0)
    }
    const open = expenses.filter(e => e.status !== 'pago')
    const overdue = open.filter(e => e.due_date && e.due_date < t)
    const next = open.filter(e => e.due_date && e.due_date >= t).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 6)
    return {
      revenue, toReceive, material, paidTotal, orders: po.length,
      profit: revenue - material - paidTotal,
      byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1]),
      overdue, overdueTotal: overdue.reduce((s, e) => s + Number(e.amount || 0), 0),
      next,
    }
  }, [orders, expenses, lookups, start, end, t])

  if (loading) return <ModulePage module="financeiro" title="Visão geral"><p>Carregando…</p></ModulePage>

  const periodName = period === 'mes' ? 'do mês' : 'do período'
  const max = r.byCat[0]?.[1] || 1

  return (
    <ModulePage module="financeiro" title="Visão geral">
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
        {!['personalizado', 'tudo'].includes(period) && <span className="toolbar-count">{formatDate(start)} a {formatDate(end)}</span>}
      </div>

      {r.overdue.length > 0 && (
        <Link to="/financeiro/contas-a-pagar" className="alert-bar">
          {r.overdue.length} conta(s) vencida(s), somando <strong>{formatMoney(r.overdueTotal)}</strong> → ver contas a pagar
        </Link>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Receita {periodName} (recebida)</div>
          <div className="value">{formatMoney(r.revenue)}</div>
          {r.toReceive > 0 && <div className="sub">+ {formatMoney(r.toReceive)} a receber</div>}
        </div>
        <div className="stat-card">
          <div className="label">Custo de material dos pedidos</div>
          <div className="value">{formatMoney(r.material)}</div>
          <div className="sub">{r.orders} pedido(s)</div>
        </div>
        <div className="stat-card">
          <div className="label">Contas pagas</div>
          <div className="value">{formatMoney(r.paidTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Lucro {periodName} (estimado)</div>
          <div className="value" style={{ color: r.profit >= 0 ? 'var(--positive)' : 'var(--danger)' }}>{formatMoney(r.profit)}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Para onde foi o dinheiro</h3>
          {r.byCat.length === 0 ? <p className="hint">Nenhuma conta paga no período.</p> : r.byCat.map(([name, value]) => (
            <div key={name} className="bar-row">
              <span className="bar-label">{name}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${(value / max) * 100}%` }} /></span>
              <span className="bar-value">{formatMoney(value)}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Próximas contas</h3>
          {r.next.length === 0 ? <p className="hint">Nenhuma conta a vencer.</p> : (
            <div className="mini-list">
              {r.next.map(e => (
                <div key={e.id} className="mini-row">
                  <span>{e.description}<span className="cell-sub"> · {lookups.suppliersById[e.supplier_id]?.name || categoryName(e, lookups.categoriesById)}</span></span>
                  <span className="num">{formatMoney(e.amount)}</span>
                  <span className={`num${e.due_date <= addDays(t, 3) ? ' danger-text' : ''}`}>{formatDate(e.due_date)}</span>
                </div>
              ))}
            </div>
          )}
          <p style={{ marginBottom: 0 }}><Link to="/financeiro/contas-a-pagar">Ver todas as contas →</Link></p>
        </div>
      </div>
    </ModulePage>
  )
}
