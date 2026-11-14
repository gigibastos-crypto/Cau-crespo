import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Modal from '../../components/Modal.jsx'
import ModulePage from '../../components/ModulePage.jsx'
import { formatMoney, periodBounds } from '../../lib/format'
import { whatsappLink } from '../../lib/delivery'

const empty = { name: '', phone: '', pix_key: '', default_fee: '', notes: '', active: true }

export default function Entregadores() {
  const [couriers, setCouriers] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  async function load() {
    setLoading(true)
    const { start, end } = periodBounds('mes')
    const [{ data, error }, { data: orders }] = await Promise.all([
      supabase.from('couriers').select('*').order('name'),
      supabase.from('orders').select('courier_id, delivery_fee, delivery_date, order_date, status')
        .not('courier_id', 'is', null),
    ])
    if (error) alert('Não foi possível carregar os entregadores: ' + error.message)
    setCouriers(data ?? [])
    const s = {}
    for (const o of orders ?? []) {
      if (o.status === 'cancelado') continue
      const d = o.delivery_date || o.order_date
      if (!d || d < start || d > end) continue
      const t = s[o.courier_id] || (s[o.courier_id] = { n: 0, total: 0 })
      t.n++
      t.total += Number(o.delivery_fee || 0)
    }
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = couriers.filter(c => showInactive || c.active)

  function openNew() { setForm(empty); setEditing('new') }
  function openEdit(c) {
    setForm({ name: c.name, phone: c.phone || '', pix_key: c.pix_key || '', default_fee: c.default_fee ?? '', notes: c.notes || '', active: c.active })
    setEditing(c.id)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      pix_key: form.pix_key || null,
      default_fee: form.default_fee === '' ? null : Number(form.default_fee),
      notes: form.notes || null,
      active: form.active,
    }
    setSaving(true)
    const { error } = editing === 'new'
      ? await supabase.from('couriers').insert(payload)
      : await supabase.from('couriers').update(payload).eq('id', editing)
    setSaving(false)
    if (error) return alert('Não foi possível salvar: ' + error.message)
    setEditing(null)
    load()
  }

  async function handleDelete() {
    const c = couriers.find(x => x.id === editing)
    if (!confirm(`Excluir "${c.name}"? Os pedidos que ele entregou continuam, mas ficam sem entregador. Se ele só parou de trabalhar com você, prefira desmarcar "Entregador ativo".`)) return
    const { error } = await supabase.from('couriers').delete().eq('id', editing)
    if (error) return alert('Não foi possível excluir: ' + error.message)
    setEditing(null)
    load()
  }

  const set = key => e => setForm({ ...form, [key]: e.target.value })

  return (
    <ModulePage module="config" title="Entregadores" actions={<button onClick={openNew}>+ Novo entregador</button>}>
      <p className="intro">Motoboys e outras pessoas que levam os pedidos. Na hora de lançar um pedido, você escolhe quem vai entregar.</p>

      <div className="toolbar">
        <label className="check">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Mostrar inativos
        </label>
      </div>

      {loading ? <p>Carregando…</p> : visible.length === 0 ? (
        <div className="empty-state card">Nenhum entregador cadastrado ainda. Clique em "+ Novo entregador".</div>
      ) : (
        <table className="cards-on-phone">
          <thead>
            <tr><th>Entregador</th><th>WhatsApp</th><th className="num">Valor de costume</th><th className="num">Entregas no mês</th><th className="num">A pagar no mês</th><th></th></tr>
          </thead>
          <tbody>
            {visible.map(c => {
              const wa = whatsappLink(c.phone)
              const s = stats[c.id] || { n: 0, total: 0 }
              return (
                <tr key={c.id} className={c.active ? '' : 'muted-row'}>
                  <td data-label="Entregador">
                    <strong className="cell-title">{c.name}</strong>
                    {!c.active && <span className="badge" style={{ marginLeft: 8 }}>Inativo</span>}
                    {c.pix_key && <div className="cell-sub">PIX: {c.pix_key}</div>}
                  </td>
                  <td data-label="WhatsApp">{wa ? <a href={wa} target="_blank" rel="noreferrer">{c.phone}</a> : (c.phone || '—')}</td>
                  <td data-label="Valor de costume" className="num">{c.default_fee != null ? formatMoney(c.default_fee) : '—'}</td>
                  <td data-label="Entregas no mês" className="num">{s.n}</td>
                  <td data-label="Valor no mês" className="num">{s.total ? formatMoney(s.total) : '—'}</td>
                  <td className="actions"><button className="ghost small" onClick={() => openEdit(c)}>Editar</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Novo entregador' : 'Editar entregador'} onClose={() => setEditing(null)}>
          <form onSubmit={handleSubmit}>
            <label>Nome *</label>
            <input required value={form.name} onChange={set('name')} placeholder="Ex.: João Motoboy" />
            <div className="row">
              <div><label>WhatsApp / Telefone</label><input value={form.phone} onChange={set('phone')} placeholder="(21) 99999-9999" /></div>
              <div><label>Valor de costume por entrega (R$)</label><input type="number" step="0.01" min="0" inputMode="decimal" value={form.default_fee} onChange={set('default_fee')} /></div>
            </div>
            <label>Chave PIX</label>
            <input value={form.pix_key} onChange={set('pix_key')} />
            <label>Observações</label>
            <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Regiões que atende, horários…" />
            <label className="check">
              <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
              Entregador ativo
            </label>
            <div className="form-actions">
              <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
              {editing !== 'new' && <button type="button" className="ghost danger-text" onClick={handleDelete}>Excluir</button>}
            </div>
          </form>
        </Modal>
      )}
    </ModulePage>
  )
}
