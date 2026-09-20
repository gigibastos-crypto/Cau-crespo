import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import Catalog from './pages/Catalog.jsx'
import Orders from './pages/Orders.jsx'
import Finance from './pages/Finance.jsx'

function PrivateArea() {
  const { session, loading } = useAuth()

  if (loading) return <div className="public-shell">Carregando…</div>
  if (!session) return <Navigate to="/login" replace />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/pedidos" element={<Orders />} />
        <Route path="/financeiro" element={<Finance />} />
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
