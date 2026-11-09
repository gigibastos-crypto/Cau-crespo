import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      return
    }
    const { data: staffRow } = await supabase
      .from('staff')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle()
    if (!staffRow) {
      await supabase.auth.signOut()
      setError('Esta conta não tem acesso ao sistema de gestão.')
      return
    }
    navigate('/')
  }

  return (
    <div className="public-shell">
      <img src="/logo.png" alt="Cau Crespo" className="logo-mark" style={{ maxWidth: 260, marginBottom: 0 }} />
      <p style={{ color: 'var(--muted)' }}>Gestão do ateliê</p>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 360, width: '100%' }}>
        <label>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        <label>Senha</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        {(error || location.state?.notStaff) && (
          <p style={{ color: 'crimson' }}>
            {error || 'Esta conta não tem acesso ao sistema de gestão.'}
          </p>
        )}
        <button type="submit">Entrar</button>
      </form>
      <p style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 360, textAlign: 'center' }}>
        O primeiro acesso é criado direto no painel do Supabase
        (Authentication → Users).
      </p>
    </div>
  )
}
