import React from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

const links = [
  { to: '/', label: 'Painel', end: true },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/financeiro', label: 'Financeiro' },
]

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-title" style={{ fontSize: 22, marginBottom: 24 }}>Cau Crespo</div>
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
