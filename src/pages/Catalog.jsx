import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal.jsx'
import { formatMoney } from '../lib/format'

const empty = { name: '', type: 'anel', material: 'prata', price: '', description: '', photo_url: '', status: 'ativo' }

const typeLabels = { anel: 'Anel', colar: 'Colar', brinco: 'Brinco', pulseira: 'Pulseira', broche: 'Broche', outro: 'Outro' }
const materialLabels = { prata: 'Prata', madeira: 'Madeira', prata_madeira: 'Prata + Madeira', outro: 'Outro' }

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(empty)
    setEditing('new')
  }

  function openEdit(p) {
    setForm(p)
    setEditing(p.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name: form.name, type: form.type, material: form.material,
      price: Number(form.price) || 0, description: form.description,
      photo_url: form.photo_url, status: form.status,
    }
    if (editing === 'new') {
      await supabase.from('products').insert(payload)
    } else {
      await supabase.from('products').update(payload).eq('id', editing)
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta peça do catálogo?')) return
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Catálogo</h1>
        <button onClick={openNew}>+ Nova peça</button>
      </div>
      <p style={{ color: 'var(--muted)', marginTop: -12, marginBottom: 20 }}>
        Modelos de referência — as peças são feitas sob encomenda, não há
        controle de quantidade em estoque.
      </p>

      {loading ? (
        <p>Carregando…</p>
      ) : products.length === 0 ? (
        <div className="empty-state card">Nenhuma peça cadastrada ainda.</div>
      ) : (
        <table>
          <thead>
            <tr><th>Peça</th><th>Tipo</th><th>Material</th><th>Preço</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{typeLabels[p.type]}</td>
                <td>{materialLabels[p.material]}</td>
                <td>{formatMoney(p.price)}</td>
                <td><span className={`badge ${p.status}`}>{p.status === 'ativo' ? 'Ativo' : 'Pausado'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button className="ghost small" onClick={() => openEdit(p)}>Editar</button>{' '}
                  <button className="danger small" onClick={() => handleDelete(p.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Nova peça' : 'Editar peça'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Nome</label>
            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="row">
              <div>
                <label>Tipo</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label>Material</label>
                <select value={form.material} onChange={e => setForm({ ...form, material: e.target.value })}>
                  {Object.entries(materialLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="row">
              <div>
                <label>Preço (R$)</label>
                <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="ativo">Ativo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>
            <label>Foto (link da imagem)</label>
            <input value={form.photo_url || ''} onChange={e => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
            <label>Descrição</label>
            <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
