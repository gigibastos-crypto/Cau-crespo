import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from '../components/Modal.jsx'
import { formatDate } from '../lib/format'

const roleLabels = { master: 'Master', funcionario: 'Funcionário' }

export default function Equipe() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'funcionario' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('list_staff')
    if (error) setError(error.message)
    else setStaff(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setForm({ email: '', role: 'funcionario' })
    setError(null)
    setAdding(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const { error } = await supabase.rpc('add_staff_member', {
      target_email: form.email.trim(),
      target_role: form.role,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setAdding(false)
    load()
  }

  async function handleRemove(member) {
    if (!confirm(`Remover ${member.email} da equipe? A pessoa perde acesso ao sistema imediatamente.`)) return
    const { error } = await supabase.rpc('remove_staff_member', { target_email: member.email })
    if (error) { setError(error.message); return }
    load()
  }

  return (
    <div>
      <div className="page-header">
        <h1>Equipe</h1>
        <button onClick={openAdd}>+ Adicionar membro</button>
      </div>

      {error && !adding && <p style={{ color: 'crimson' }}>{error}</p>}

      {loading ? (
        <p>Carregando…</p>
      ) : staff.length === 0 ? (
        <div className="empty-state card">Nenhum membro cadastrado ainda.</div>
      ) : (
        <table>
          <thead>
            <tr><th>E-mail</th><th>Papel</th><th>Desde</th><th></th></tr>
          </thead>
          <tbody>
            {staff.map(m => (
              <tr key={m.user_id}>
                <td>{m.email}</td>
                <td>{roleLabels[m.role] || m.role}</td>
                <td>{formatDate(m.created_at)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="danger small" onClick={() => handleRemove(m)}>Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {adding && (
        <Modal title="Adicionar membro" onClose={() => setAdding(false)}>
          <form onSubmit={handleSubmit}>
            <label>E-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="pessoa@exemplo.com"
            />
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: -8 }}>
              A pessoa precisa já ter uma conta criada (pelo painel do Supabase ou se cadastrando em Minha Cau no site).
            </p>

            <label>Papel</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="funcionario">Funcionário</option>
              <option value="master">Master</option>
            </select>

            {error && <p style={{ color: 'crimson' }}>{error}</p>}

            <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Adicionar'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
