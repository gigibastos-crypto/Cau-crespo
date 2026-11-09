import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
        <div style={{ position: 'relative' }}>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            required
            style={{ width: '100%', paddingRight: 40 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center', color: 'var(--muted)',
            }}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 3l18 18" strokeLinecap="round" />
                <path d="M10.6 5.1A10.6 10.6 0 0112 5c6 0 10 5 10 7 0 1-1 2.6-3 4.3M6.3 6.6C4.1 8 2.5 10 2 12c0 2 4 7 10 7 1.5 0 2.9-.3 4.1-.8" strokeLinecap="round" />
                <path d="M9.5 9.8A3 3 0 0012 15a3 3 0 002.3-1" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 12c0-2 4-7 10-7s10 5 10 7-4 7-10 7-10-5-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
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
