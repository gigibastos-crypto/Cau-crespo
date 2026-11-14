import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import Catalog from './pages/Catalog.jsx'
import Orders from './pages/Orders.jsx'
import VisaoGeral from './pages/financeiro/VisaoGeral.jsx'
import ContasAPagar from './pages/financeiro/ContasAPagar.jsx'
import Fornecedores from './pages/config/Fornecedores.jsx'
import Categorias from './pages/config/Categorias.jsx'
import PosicaoEstoque from './pages/estoque/PosicaoEstoque.jsx'
import Movimentacoes from './pages/estoque/Movimentacoes.jsx'
import Equipe from './pages/Equipe.jsx'

function PrivateArea() {
  const { session, loading, isStaff, isMaster } = useAuth()

  if (loading) return <div className="public-shell">Carregando…</div>
  if (!session) return <Navigate to="/login" replace />

  if (isStaff === null) return <div className="public-shell">Carregando…</div>
  if (isStaff === false) return <Navigate to="/login" replace state={{ notStaff: true }} />

  const master = el => (isMaster ? el : <Navigate to="/" replace />)

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/estoque" element={<PosicaoEstoque />} />
        <Route path="/estoque/movimentacoes" element={<Movimentacoes />} />
        <Route path="/financeiro" element={master(<VisaoGeral />)} />
        <Route path="/financeiro/contas-a-pagar" element={master(<ContasAPagar />)} />
        <Route path="/configuracoes" element={<Navigate to="/configuracoes/fornecedores" replace />} />
        <Route path="/configuracoes/fornecedores" element={master(<Fornecedores />)} />
        <Route path="/configuracoes/categorias" element={master(<Categorias />)} />
        <Route path="/configuracoes/equipe" element={master(<Equipe />)} />
        <Route path="/equipe" element={<Navigate to="/configuracoes/equipe" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<PrivateArea />} />
      </Routes>
    </AuthProvider>
  )
}
