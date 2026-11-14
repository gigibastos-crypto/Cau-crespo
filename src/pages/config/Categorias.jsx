import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import ModulePage from '../../components/ModulePage.jsx'

export default function Categorias() {
  const [categories, setCategories] = useState([])
  const [usage, setUsage] = useState({})
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  async function load() {
    setLoading(true)
    const [{ data, error }, { data: exp }] = await Promise.all([
      supabase.from('expense_categories').select('*').order('name'),
      supabase.from('expenses').select('category_id').not('category_id', 'is', null),
    ])
    if (error) alert('Não foi possível carregar as categorias: ' + error.message)
    setCategories(data ?? [])
    const u = {}
    for (const e of exp ?? []) u[e.category_id] = (u[e.category_id] || 0) + 1
    setUsage(u)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    const { error } = await supabase.from('expense_categories').insert({ name })
    if (error) return alert(error.code === '23505' ? 'Já existe uma categoria com esse nome.' : error.message)
    setNewName('')
    load()
  }

  async function rename(c) {
    const name = editName.trim()
    if (!name || name === c.name) { setEditingId(null); return }
    const { error } = await supabase.from('expense_categories').update({ name }).eq('id', c.id)
    if (error) return alert(error.code === '23505' ? 'Já existe uma categoria com esse nome.' : error.message)
    setEditingId(null)
    load()
  }

  async function toggle(c) {
    const { error } = await supabase.from('expense_categories').update({ active: !c.active }).eq('id', c.id)
    if (error) return alert(error.message)
    load()
  }

  async function remove(c) {
    if (usage[c.id]) return alert(`Esta categoria está em ${usage[c.id]} conta(s). Desative em vez de excluir, para não perder o histórico.`)
    if (!confirm(`Excluir a categoria "${c.name}"?`)) return
    const { error } = await supabase.from('expense_categories').delete().eq('id', c.id)
    if (error) return alert(error.message)
    load()
  }

  return (
    <ModulePage module="config" title="Categorias de despesa">
      <p className="intro">As categorias organizam as contas a pagar e mostram, na visão geral, para onde está indo o dinheiro.</p>

      <form onSubmit={add} className="toolbar">
        <input placeholder="Nova categoria (ex.: Ourives terceirizado)" value={newName} onChange={e => setNewName(e.target.value)} />
        <button type="submit" disabled={!newName.trim()}>Adicionar</button>
      </form>

      {loading ? <p>Carregando…</p> : (
        <table className="cards-on-phone">
          <thead><tr><th>Categoria</th><th>Contas</th><th>Situação</th><th></th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id} className={c.active ? '' : 'muted-row'}>
                <td data-label="Categoria">
                  {editingId === c.id ? (
                    <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                      onBlur={() => rename(c)} onKeyDown={e => { if (e.key === 'Enter') rename(c); if (e.key === 'Escape') setEditingId(null) }}
                      style={{ margin: 0 }} />
                  ) : <strong className="cell-title">{c.name}</strong>}
                </td>
                <td data-label="Contas" className="num">{usage[c.id] || 0}</td>
                <td data-label="Situação"><span className={`badge ${c.active ? 'ativo' : 'pausado'}`}>{c.active ? 'Ativa' : 'Inativa'}</span></td>
                <td className="actions">
                  <button className="ghost small" onClick={() => { setEditingId(c.id); setEditName(c.name) }}>Renomear</button>{' '}
                  <button className="ghost small" onClick={() => toggle(c)}>{c.active ? 'Desativar' : 'Ativar'}</button>{' '}
                  <button className="ghost small danger-text" onClick={() => remove(c)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModulePage>
  )
}
