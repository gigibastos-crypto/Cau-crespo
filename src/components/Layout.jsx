import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../lib/AuthContext.jsx'
import { icons, visibleModules } from '../lib/modules.jsx'

function isInModule(pathname, mod) {
  if (mod.end) return pathname === mod.to
  return pathname === mod.to || pathname.startsWith(mod.to + '/')
}

export default function Layout({ children }) {
  const { isMaster } = useAuth()
  const { pathname } = useLocation()
  const modules = visibleModules(isMaster)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img src="/logo.png" alt="Cau Crespo" className="logo-mark" />
        <nav>
          {modules.map(mod => {
            const open = isInModule(pathname, mod)
            return (
              <div key={mod.key} className={'nav-module' + (open ? ' open' : '')}>
                <NavLink
                  to={mod.pages ? mod.pages[0].to : mod.to}
                  end={mod.end}
                  className={'nav-link' + (open ? ' active' : '')}
                >
                  {mod.icon}
                  <span className="nav-label nav-label-full">{mod.label}</span>
                  <span className="nav-label nav-label-short">{mod.short || mod.label}</span>
                </NavLink>
                {mod.pages && open && (
                  <div className="nav-sub">
                    {mod.pages.map(p => (
                      <NavLink key={p.to} to={p.to} end={p.end}
                        className={({ isActive }) => 'nav-sublink' + (isActive ? ' active' : '')}>
                        {p.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <button className="ghost nav-logout" onClick={() => supabase.auth.signOut()} title="Sair">
          {icons.sair}
          <span className="nav-label">Sair</span>
        </button>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
