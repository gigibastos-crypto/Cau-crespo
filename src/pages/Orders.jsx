import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal.jsx'
import { formatMoney, formatDate } from '../lib/format'

const channelLabels = { atelie: 'Ateliê', whatsapp: 'WhatsApp', instagram: 'Instagram' }
const statusLabels = { encomendado: 'Encomendado', em_producao: 'Em produção', pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado' }

const emptyItem = () => ({ key: crypto.randomUUID(), product_id: '', description: '', unit_price: '', quantity: 1 })

const emptyForm = () => ({
  client_id: '', channel: 'whatsapp', status: 'encomendado', payment_status: 'pendente',
  order_date: new Date().toISOString().slice(0, 10), delivery_date: '', material_cost: '', notes: '',
  items: [emptyItem()],
})

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm())

  async function load() {
    setLoading(true)
    const [{ data: ordersData }, { data: clientsData }, { data: productsData }] = await Promise.all([
      supabase.from('orders').select('*, clients(name), order_items(*)').order('order_date', { ascending: false }),
      supabase.from('clients').select('id,name').order('name'),
      supabase.from('products').select('id,name,price').eq('status', 'ativo').order('name'),
    ])
    setOrders(ordersData ?? [])
    setClients(clientsData ?? [])
    setProducts(productsData ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(emptyForm())
    setEditing('new')
  }

  function openEdit(order) {
    setForm({
      client_id: order.client_id || '',
      channel: order.channel,
      status: order.status,
      payment_status: order.payment_status,
      order_date: order.order_date,
      delivery_date: order.delivery_date || '',
      material_cost: order.material_cost ?? '',
      notes: order.notes || '',
      items: order.order_items.length
        ? order.order_items.map(i => ({ key: i.id, product_id: i.product_id || '', description: i.description, unit_price: i.unit_price, quantity: i.quantity }))
        : [emptyItem()],
    })
    setEditing(order.id)
  }

  function updateItem(key, patch) {
    setForm(f => ({ ...f, items: f.items.map(i => i.key === key ? { ...i, ...patch } : i) }))
  }

  function pickProduct(key, productId) {
    const product = products.find(p => p.id === productId)
    updateItem(key, {
      product_id: productId,
      description: product ? product.name : '',
      unit_price: product ? product.price : '',
    })
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, emptyItem()] }))
  }

  function removeItem(key) {
    setForm(f => ({ ...f, items: f.items.filter(i => i.key !== key) }))
  }

  const total = useMemo(
    () => form.items.reduce((sum, i) => sum + (Number(i.unit_price) || 0) * (Number(i.quantity) || 0), 0),
    [form.items]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      client_id: form.client_id || null,
      channel: form.channel,
      status: form.status,
      payment_status: form.payment_status,
      order_date: form.order_date,
      delivery_date: form.delivery_date || null,
      total_value: total,
      material_cost: form.material_cost === '' ? null : Number(form.material_cost),
      notes: form.notes,
    }

    let orderId = editing
    if (editing === 'new') {
      const { data, error } = await supabase.from('orders').insert(payload).select('id').single()
      if (error) return alert(error.message)
      orderId = data.id
    } else {
      const { error } = await supabase.from('orders').update(payload).eq('id', editing)
      if (error) return alert(error.message)
      await supabase.from('order_items').delete().eq('order_id', editing)
    }

    const items = form.items
      .filter(i => i.description.trim())
      .map(i => ({
        order_id: orderId,
        product_id: i.product_id || null,
        description: i.description,
        unit_price: Number(i.unit_price) || 0,
        quantity: Number(i.quantity) || 1,
      }))
    if (items.length) await supabase.from('order_items').insert(items)

    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este pedido?')) return
    await supabase.from('orders').delete().eq('id', id)
    load()
  }

  async function quickStatus(order, status) {
    await supabase.from('orders').update({ status }).eq('id', order.id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pedidos</h1>
        <button onClick={openNew}>+ Novo pedido</button>
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : orders.length === 0 ? (
        <div className="empty-state card">Nenhum pedido registrado ainda.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Cliente</th><th>Canal</th><th>Peças</th><th>Valor</th>
              <th>Status</th><th>Pagamento</th><th>Pedido em</th><th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.clients?.name || '—'}</td>
                <td>{channelLabels[o.channel]}</td>
                <td>{o.order_items.map(i => i.description).join(', ') || '—'}</td>
                <td>{formatMoney(o.total_value)}</td>
                <td>
                  <select className="badge" style={{ border: 'none' }} value={o.status} onChange={e => quickStatus(o, e.target.value)}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td><span className={`badge ${o.payment_status}`}>{o.payment_status === 'pago' ? 'Pago' : 'Pendente'}</span></td>
                <td>{formatDate(o.order_date)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="ghost small" onClick={() => openEdit(o)}>Editar</button>{' '}
                  <button className="danger small" onClick={() => handleDelete(o.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Novo pedido' : 'Editar pedido'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Cliente</label>
            <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}>
              <option value="">Sem cliente vinculado</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <div className="row">
              <div>
                <label>Canal</label>
                <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}>
                  {Object.entries(channelLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="row">
              <div>
                <label>Data do pedido</label>
                <input type="date" required value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} />
              </div>
              <div>
                <label>Entrega prevista</label>
                <input type="date" value={form.delivery_date} onChange={e => setForm({ ...form, delivery_date: e.target.value })} />
              </div>
            </div>

            <label>Peças do pedido</label>
            {form.items.map(item => (
              <div key={item.key} className="row" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <select value={item.product_id} onChange={e => pickProduct(item.key, e.target.value)}>
                    <option value="">Peça personalizada…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input
                    placeholder="Descrição da peça"
                    value={item.description}
                    onChange={e => updateItem(item.key, { description: e.target.value })}
                  />
                </div>
                <div style={{ flex: '0 0 90px' }}>
                  <input type="number" step="0.01" min="0" placeholder="Preço" value={item.unit_price}
                    onChange={e => updateItem(item.key, { unit_price: e.target.value })} />
                </div>
                <div style={{ flex: '0 0 60px' }}>
                  <input type="number" min="1" placeholder="Qtd" value={item.quantity}
                    onChange={e => updateItem(item.key, { quantity: e.target.value })} />
                </div>
                <button type="button" className="ghost small" onClick={() => removeItem(item.key)}>×</button>
              </div>
            ))}
            <button type="button" className="ghost small" onClick={addItem} style={{ marginBottom: 12 }}>+ Adicionar peça</button>

            <p style={{ fontWeight: 600 }}>Total: {formatMoney(total)}</p>

            <div className="row">
              <div>
                <label>Custo de material (opcional)</label>
                <input type="number" step="0.01" min="0" value={form.material_cost}
                  onChange={e => setForm({ ...form, material_cost: e.target.value })} />
              </div>
              <div>
                <label>Pagamento</label>
                <select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value })}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>
            </div>

            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

            <button type="submit">Salvar pedido</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
