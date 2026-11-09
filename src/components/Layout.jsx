import React from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext.jsx'

function Icon({ path }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  )
}

const icons = {
  painel: <Icon path={<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>} />,
  pedidos: <Icon path={<><path d="M3.5 7.5L12 3l8.5 4.5V16L12 20.5 3.5 16V7.5z" /><path d="M3.5 7.5L12 12l8.5-4.5" /><path d="M12 12v8.5" /></>} />,
  clientes: <Icon path={<><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" /><circle cx="17" cy="9" r="2.3" /><path d="M14.8 13.8c2.4.4 4.2 2.4 4.2 5.2" /></>} />,
  catalogo: <Icon path={<><path d="M7 3.5h10l4 5.5-9 11.5-9-11.5 4-5.5z" /><path d="M3 9h18M9.5 3.5L8 9l4 11.5 4-11.5-1.5-5.5" /></>} />,
  financeiro: <Icon path={<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M14.8 9.8a2.6 2.6 0 00-2.5-1.8c-1.5 0-2.6.9-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2a2.7 2.7 0 01-2.6-1.8" /></>} />,
  equipe: <Icon path={<><circle cx="8.5" cy="8" r="3" /><path d="M2.5 19c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="8.5" r="2.3" /><path d="M15 13.3c2.4.5 4 2.6 4 5.2" /><path d="M16.5 4.3a2.6 2.6 0 010 4.4" /></>} />,
  sair: <Icon path={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>} />,
}

const baseLinks = [
  { to: '/', label: 'Painel', end: true, icon: icons.painel },
  { to: '/pedidos', label: 'Pedidos', icon: icons.pedidos },
  { to: '/clientes', label: 'Clientes', icon: icons.clientes },
  { to: '/catalogo', label: 'Catálogo', icon: icons.catalogo },
]

const masterLinks = [
  { to: '/financeiro', label: 'Financeiro', icon: icons.financeiro },
  { to: '/equipe', label: 'Equipe', icon: icons.equipe },
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
              {link.icon}
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="ghost nav-logout" onClick={() => supabase.auth.signOut()}>
          {icons.sair}
          <span className="nav-label">Sair</span>
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
