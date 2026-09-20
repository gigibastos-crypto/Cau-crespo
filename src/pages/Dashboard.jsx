import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatMoney, formatDate } from '../lib/format'

const statusLabels = { encomendado: 'Encomendado', em_producao: 'Em produção', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' }

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const iso = d => d.toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end) }
}

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('*, clients(name)').order('order_date', { ascending: false }),
      supabase.from('expenses').select('*').eq('status', 'pendente').order('due_date', { ascending: true }),
    ]).then(([{ data: ordersData }, { data: expensesData }]) => {
      setOrders(ordersData ?? [])
      setExpenses(expensesData ?? [])
      setLoading(false)
    })
  }, [])

  const { start, end } = monthBounds()
  const monthOrders = useMemo(() => orders.filter(o => o.order_date >= start && o.order_date <= end), [orders, start, end])
  const revenue = useMemo(
    () => monthOrders.filter(o => o.payment_status === 'pago').reduce((s, o) => s + Number(o.total_value || 0), 0),
    [monthOrders]
  )
  const inProduction = useMemo(() => orders.filter(o => o.status === 'em_producao'), [orders])
  const upcomingDeliveries = useMemo(
    () => orders.filter(o => o.delivery_date && o.status !== 'entregue' && o.status !== 'cancelado')
      .sort((a, b) => a.delivery_date.localeCompare(b.delivery_date)).slice(0, 5),
    [orders]
  )
  const nextExpenses = expenses.slice(0, 5)

  if (loading) return <p>Carregando…</p>

  return (
    <div>
      <div className="page-header"><h1>Painel</h1></div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Vendido no mês (pago)</div>
          <div className="value">{formatMoney(revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pedidos em produção</div>
          <div className="value">{inProduction.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pedidos este mês</div>
          <div className="value">{monthOrders.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Contas a pagar pendentes</div>
          <div className="value">{formatMoney(expenses.reduce((s, e) => s + Number(e.amount || 0), 0))}</div>
        </div>
      </div>

      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Próximas entregas</h3>
          {upcomingDeliveries.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Nenhuma entrega agendada.</p>
          ) : (
            <table>
              <tbody>
                {upcomingDeliveries.map(o => (
                  <tr key={o.id}>
                    <td>{o.clients?.name || '—'}</td>
                    <td><span className={`badge ${o.status}`}>{statusLabels[o.status]}</span></td>
                    <td>{formatDate(o.delivery_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p><Link to="/pedidos">Ver todos os pedidos →</Link></p>
        </div>

        <div className="card" style={{ flex: 1 }}>
          <h3 style={{ marginTop: 0 }}>Contas a pagar próximas</h3>
          {nextExpenses.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Nenhuma pendência.</p>
          ) : (
            <table>
              <tbody>
                {nextExpenses.map(e => (
                  <tr key={e.id}>
                    <td>{e.description}</td>
                    <td>{formatMoney(e.amount)}</td>
                    <td>{formatDate(e.due_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p><Link to="/financeiro">Ver financeiro →</Link></p>
        </div>
      </div>
    </div>
  )
}
