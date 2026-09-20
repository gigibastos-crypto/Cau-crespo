import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal.jsx'

const empty = { name: '', phone: '', instagram: '', notes: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(empty)
    setEditing('new')
  }

  function openEdit(client) {
    setForm(client)
    setEditing(client.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editing === 'new') {
      await supabase.from('clients').insert({
        name: form.name, phone: form.phone, instagram: form.instagram, notes: form.notes,
      })
    } else {
      await supabase.from('clients').update({
        name: form.name, phone: form.phone, instagram: form.instagram, notes: form.notes,
      }).eq('id', editing)
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta cliente? Os pedidos ligados a ela vão ficar sem cliente vinculado.')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={openNew}>+ Nova cliente</button>
      </div>

      {loading ? (
        <p>Carregando…</p>
      ) : clients.length === 0 ? (
        <div className="empty-state card">Nenhuma cliente cadastrada ainda.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Nome</th><th>WhatsApp</th><th>Instagram</th><th></th></tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.instagram || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="ghost small" onClick={() => openEdit(c)}>Editar</button>{' '}
                  <button className="danger small" onClick={() => handleDelete(c.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nova cliente' : 'Editar cliente'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Nome</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <label>WhatsApp</label>
            <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 91234-5678" />
            <label>Instagram</label>
            <input value={form.instagram || ''} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
            <label>Observações</label>
            <textarea rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
