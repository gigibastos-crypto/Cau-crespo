import React from 'react'
import { NavLink } from 'react-router-dom'
import { findModule } from '../lib/modules.jsx'

// Cabeçalho de página dentro de um módulo: nome do módulo + abas das páginas
export default function ModulePage({ module, title, actions, children }) {
  const mod = findModule(module)
  return (
    <div>
      <div className="module-eyebrow">{mod?.label}</div>
      <div className="page-header">
        <h1>{title}</h1>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {mod?.pages && (
        <nav className="subnav">
          {mod.pages.map(p => (
            <NavLink key={p.to} to={p.to} end={p.end}
              className={({ isActive }) => 'subnav-link' + (isActive ? ' active' : '')}>
              {p.label}
            </NavLink>
          ))}
        </nav>
      )}
      {children}
    </div>
  )
}
