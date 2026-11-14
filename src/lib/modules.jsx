import React from 'react'

// Ícones (traço fino, mesmo estilo do menu)
function Icon({ path }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {path}
    </svg>
  )
}

export const icons = {
  painel: <Icon path={<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>} />,
  pedidos: <Icon path={<><path d="M3.5 7.5L12 3l8.5 4.5V16L12 20.5 3.5 16V7.5z" /><path d="M3.5 7.5L12 12l8.5-4.5" /><path d="M12 12v8.5" /></>} />,
  clientes: <Icon path={<><circle cx="9" cy="8" r="3" /><path d="M3.5 19c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" /><circle cx="17" cy="9" r="2.3" /><path d="M14.8 13.8c2.4.4 4.2 2.4 4.2 5.2" /></>} />,
  catalogo: <Icon path={<><path d="M7 3.5h10l4 5.5-9 11.5-9-11.5 4-5.5z" /><path d="M3 9h18M9.5 3.5L8 9l4 11.5 4-11.5-1.5-5.5" /></>} />,
  estoque: <Icon path={<><path d="M3.5 9.5h17v10a1 1 0 01-1 1h-15a1 1 0 01-1-1v-10z" /><path d="M2.5 5.5a1 1 0 011-1h17a1 1 0 011 1v4h-19v-4z" /><path d="M10 13.5h4" /></>} />,
  financeiro: <Icon path={<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v9M14.8 9.8a2.6 2.6 0 00-2.5-1.8c-1.5 0-2.6.9-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2a2.7 2.7 0 01-2.6-1.8" /></>} />,
  config: <Icon path={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>} />,
  sair: <Icon path={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>} />,
}

// Módulos do sistema. "pages" vira o submenu (no computador, abaixo do
// módulo; em todas as telas, como abas no topo da página).
export const MODULES = [
  { key: 'painel', label: 'Painel', short: 'Início', to: '/', end: true, icon: icons.painel },
  { key: 'pedidos', label: 'Pedidos', to: '/pedidos', icon: icons.pedidos },
  { key: 'clientes', label: 'Clientes', to: '/clientes', icon: icons.clientes },
  { key: 'catalogo', label: 'Catálogo', to: '/catalogo', icon: icons.catalogo },
  {
    key: 'estoque', label: 'Estoque', to: '/estoque', icon: icons.estoque,
    pages: [
      { to: '/estoque', label: 'Posição do estoque', end: true },
      { to: '/estoque/movimentacoes', label: 'Movimentações' },
    ],
  },
  {
    key: 'financeiro', label: 'Financeiro', short: 'Finanças', to: '/financeiro', icon: icons.financeiro, master: true,
    pages: [
      { to: '/financeiro', label: 'Visão geral', end: true },
      { to: '/financeiro/contas-a-pagar', label: 'Contas a pagar' },
    ],
  },
  {
    key: 'config', label: 'Configurações', short: 'Ajustes', to: '/configuracoes', icon: icons.config, master: true,
    pages: [
      { to: '/configuracoes/fornecedores', label: 'Fornecedores' },
      { to: '/configuracoes/categorias', label: 'Categorias de despesa' },
      { to: '/configuracoes/equipe', label: 'Equipe' },
    ],
  },
]

export function visibleModules(isMaster) {
  return MODULES.filter(m => !m.master || isMaster)
}

export function findModule(key) {
  return MODULES.find(m => m.key === key)
}
