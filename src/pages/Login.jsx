import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/')
  }

  return (
    <div className="public-shell">
      <h1 className="brand-title">Cau Crespo</h1>
      <p style={{ color: 'var(--muted)' }}>Gestão do ateliê</p>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 360, width: '100%' }}>
        <label>E-mail</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        <label>Senha</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
      <p style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 360, textAlign: 'center' }}>
        O primeiro acesso é criado direto no painel do Supabase
        (Authentication → Users).
      </p>
    </div>
  )
}
