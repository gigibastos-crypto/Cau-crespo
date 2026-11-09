import React from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext.jsx'

const baseLinks = [
  { to: '/', label: 'Painel', end: true },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/catalogo', label: 'Catálogo' },
]

const masterLinks = [
  { to: '/financeiro', label: 'Financeiro' },
  { to: '/equipe', label: 'Equipe' },
]

export default function Layout({ children }) {
  const { isMaster } = useAuth()
  const links = isMaster ? [...baseLinks, ...masterLinks] : baseLinks
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img src="/logo.png" alt="Cau Crespo" className="logo-mark" />
        <nav>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button className="ghost" style={{ marginTop: 'auto' }} onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
