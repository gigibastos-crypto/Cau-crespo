import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal.jsx'
import { formatCPF, formatCEP, lookupCEP } from '../lib/masks'
import { formatDate } from '../lib/format'

const empty = {
  name: '', cpf: '', email: '', phone: '', instagram: '', preferred_contact: 'whatsapp',
  birth_date: '', is_vip: false, cep: '', street: '', address_number: '', complement: '',
  neighborhood: '', city: '', state: '', notes: '',
}

const contactLabels = { whatsapp: 'WhatsApp', telefone: 'Telefone', email: 'E-mail', instagram: 'Instagram' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [cepStatus, setCepStatus] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setForm(empty)
    setCepStatus(null)
    setEditing('new')
  }

  function openEdit(client) {
    setForm({ ...empty, ...client })
    setCepStatus(null)
    setEditing(client.id)
  }

  async function handleCepBlur() {
    const digits = form.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setCepStatus('loading')
    try {
      const address = await lookupCEP(form.cep)
      if (!address) { setCepStatus('not-found'); return }
      setForm(f => ({ ...f, street: address.street, neighborhood: address.neighborhood, city: address.city, state: address.state }))
      setCepStatus('found')
    } catch {
      setCepStatus('error')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form, birth_date: form.birth_date || null }
    delete payload.id
    delete payload.created_at
    if (editing === 'new') {
      await supabase.from('clients').insert(payload)
    } else {
      await supabase.from('clients').update(payload).eq('id', editing)
    }
    setEditing(null)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Excluir esta cliente? Os pedidos ligados a ela vão ficar sem cliente vinculado.')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  async function toggleVip(client) {
    await supabase.from('clients').update({ is_vip: !client.is_vip }).eq('id', client.id)
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
            <tr><th></th><th>Nome</th><th>Cidade</th><th>Contato preferido</th><th>Telefone</th><th>Aniversário</th><th></th></tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>
                  <button type="button" className="ghost small" title={c.is_vip ? 'Remover VIP' : 'Marcar como VIP'} onClick={() => toggleVip(c)} style={{ fontSize: 16, lineHeight: 1, padding: '2px 6px' }}>
                    {c.is_vip ? '★' : '☆'}
                  </button>
                </td>
                <td>{c.name}</td>
                <td>{c.city || '—'}</td>
                <td>{contactLabels[c.preferred_contact] || '—'}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.birth_date ? formatDate(c.birth_date) : '—'}</td>
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
            <div className="row">
              <div style={{ flex: 3 }}>
                <label>Nome completo</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="button"
                  className={form.is_vip ? '' : 'ghost'}
                  onClick={() => setForm({ ...form, is_vip: !form.is_vip })}
                  style={{ width: '100%', marginBottom: 12 }}
                  title="Cliente VIP"
                >
                  {form.is_vip ? '★ VIP' : '☆ VIP'}
                </button>
              </div>
            </div>

            <div className="row">
              <div>
                <label>CPF</label>
                <input value={form.cpf} placeholder="000.000.000-00" onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })} />
              </div>
              <div>
                <label>Data de nascimento</label>
                <input type="date" value={form.birth_date || ''} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
              </div>
            </div>

            <label>E-mail</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />

            <div className="row">
              <div>
                <label>WhatsApp / Telefone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 91234-5678" />
              </div>
              <div>
                <label>Instagram</label>
                <input value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@usuario" />
              </div>
            </div>

            <label>Prefere ser contatada por</label>
            <select value={form.preferred_contact} onChange={e => setForm({ ...form, preferred_contact: e.target.value })}>
              {Object.entries(contactLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>

            <div className="row">
              <div>
                <label>CEP</label>
                <input
                  value={form.cep}
                  placeholder="00000-000"
                  onChange={e => setForm({ ...form, cep: formatCEP(e.target.value) })}
                  onBlur={handleCepBlur}
                />
              </div>
              <div>
                <label>Número</label>
                <input value={form.address_number} onChange={e => setForm({ ...form, address_number: e.target.value })} />
              </div>
              <div>
                <label>Complemento</label>
                <input value={form.complement} onChange={e => setForm({ ...form, complement: e.target.value })} />
              </div>
            </div>
            {cepStatus === 'loading' && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -8 }}>Buscando endereço…</p>}
            {cepStatus === 'not-found' && <p style={{ fontSize: 12, color: 'crimson', marginTop: -8 }}>CEP não encontrado — preencha o endereço manualmente.</p>}
            {cepStatus === 'error' && <p style={{ fontSize: 12, color: 'crimson', marginTop: -8 }}>Não deu para buscar o CEP agora — preencha o endereço manualmente.</p>}

            <label>Rua</label>
            <input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} />

            <div className="row">
              <div>
                <label>Bairro</label>
                <input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} />
              </div>
              <div>
                <label>Cidade</label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <label>UF</label>
                <input value={form.state} maxLength={2} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} />
              </div>
            </div>

            <label>Observações</label>
            <textarea rows={3} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <button type="submit">Salvar</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
