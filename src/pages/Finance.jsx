import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal.jsx'
import { formatMoney, formatDate } from '../lib/format'

const categoryLabels = { materia_prima: 'Matéria-prima', ferramentas: 'Ferramentas', embalagem: 'Embalagem', marketing: 'Marketing', outro: 'Outro' }

const emptyForm = { description: '', category: 'materia_prima', amount: '', due_date: '', status: 'pendente' }

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const iso = d => d.toISOString().slice(0, 10)
  return { start: iso(start), end: iso(end) }
}

export default function Finance() {
  const [orders, setOrders] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    const [{ data: ordersData }, { data: expensesData }] = await Promise.all([
      supabase.from('orders').select('order_date,total_value,material_cost,payment_status'),
      supabase.from('expenses').select('*').order('due_date', { ascending: true }),
    ])
    setOrders(ordersData ?? [])
    setExpenses(expensesData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const { start, end } = monthBounds()

  const monthOrders = useMemo(
    () => orders.filter(o => o.order_date >= start && o.order_date <= end),
    [orders, start, end]
  )
  const revenue = useMemo(
    () => monthOrders.filter(o => o.payment_status === 'pago').reduce((s, o) => s + Number(o.total_value || 0), 0),
    [monthOrders]
  )
  const materialCosts = useMemo(
    () => monthOrders.reduce((s, o) => s + Number(o.material_cost || 0), 0),
    [monthOrders]
  )
  const monthExpensesPaid = useMemo(
    () => expenses.filter(e => e.status === 'pago' && e.paid_at >= start && e.paid_at <= end).reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses, start, end]
  )
  const profit = revenue - materialCosts - monthExpensesPaid
  const pendingExpenses = useMemo(() => expenses.filter(e => e.status === 'pendente'), [expenses])
  const pendingTotal = useMemo(() => pendingExpenses.reduce((s, e) => s + Number(e.amount || 0), 0), [pendingExpenses])

  function openNew() {
    setForm(emptyForm)
    setEditing('new')
  }

  function openEdit(expense) {
    setForm({ ...expense, amount: expense.amount, due_date: expense.due_date || '' })
    setEditing(expense.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      description: form.description,
      category: form.category,
      amount: Number(form.amount) || 0,
      due_date: form.due_date || null,
      status: form.status,
      paid_at: form.status === 'pago' ? (form.paid_at || new Date().toISOString().slice(0, 10)) : null,
    }
    if (editing === 'new') {
      await supabase.from('expenses').insert(payload)
    } else {
      await supabase.from('expenses').update(payload).eq('id', editing)
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta despesa?')) return
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  async function markPaid(expense) {
    await supabase.from('expenses').update({ status: 'pago', paid_at: new Date().toISOString().slice(0, 10) }).eq('id', expense.id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Financeiro</h1>
        <button onClick={openNew}>+ Nova despesa</button>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Receita do mês (pago)</div>
          <div className="value">{formatMoney(revenue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Custos de material do mês</div>
          <div className="value">{formatMoney(materialCosts)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Despesas pagas no mês</div>
          <div className="value">{formatMoney(monthExpensesPaid)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Lucro do mês (estimado)</div>
          <div className="value" style={{ color: profit >= 0 ? '#2e6b34' : 'crimson' }}>{formatMoney(profit)}</div>
        </div>
      </div>

      <h2>Contas a pagar</h2>
      {loading ? (
        <p>Carregando…</p>
      ) : expenses.length === 0 ? (
        <div className="empty-state card">Nenhuma despesa cadastrada ainda.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Vencimento</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id}>
                <td>{e.description}</td>
                <td>{categoryLabels[e.category]}</td>
                <td>{formatMoney(e.amount)}</td>
                <td>{formatDate(e.due_date)}</td>
                <td><span className={`badge ${e.status}`}>{e.status === 'pago' ? 'Pago' : 'Pendente'}</span></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {e.status === 'pendente' && <button className="ghost small" onClick={() => markPaid(e)}>Marcar pago</button>}{' '}
                  <button className="ghost small" onClick={() => openEdit(e)}>Editar</button>{' '}
                  <button className="danger small" onClick={() => handleDelete(e.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pendingExpenses.length > 0 && (
        <p style={{ marginTop: 12, color: 'var(--muted)' }}>
          Total pendente: <strong style={{ color: 'var(--text)' }}>{formatMoney(pendingTotal)}</strong>
        </p>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nova despesa' : 'Editar despesa'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Descrição</label>
            <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="row">
              <div>
                <label>Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>Valor (R$)</label>
                <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="row">
              <div>
                <label>Vencimento</label>
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
            </div>
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
