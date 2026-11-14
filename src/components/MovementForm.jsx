import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Modal from './Modal.jsx'
import { formatMoney, formatNumber, today } from '../lib/format'
import { itemName, UNITS } from '../lib/stock'

// Registrar entrada / saída / ajuste de um ou mais itens
export default function MovementForm({ items, initialItemId, initialType = 'entrada', onClose, onSaved }) {
  const [form, setForm] = useState({
    item_id: initialItemId || '', type: initialType, quantity: '', unit_cost: '', total_cost: '',
    movement_date: today(), supplier_id: '', reason: '',
  })
  const [suppliers, setSuppliers] = useState([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('suppliers').select('id, name').eq('active', true).order('name').then(({ data }) => setSuppliers(data ?? []))
  }, [])

  const item = items.find(i => i.id === form.item_id)
  const unit = item?.unit || 'un'
  const qty = Number(form.quantity) || 0

  function setQty(v) {
    setForm(f => ({ ...f, quantity: v, total_cost: f.unit_cost && Number(v) ? (Number(f.unit_cost) * Number(v)).toFixed(2) : f.total_cost }))
  }
  function setUnitCost(v) {
    setForm(f => ({ ...f, unit_cost: v, total_cost: v && qty ? (Number(v) * qty).toFixed(2) : '' }))
  }
  function setTotalCost(v) {
    setForm(f => ({ ...f, total_cost: v, unit_cost: v && qty ? (Number(v) / qty).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : '' }))
  }

  // prévia do novo saldo e custo médio
  let preview = null
  if (item && qty > 0) {
    const q0 = Number(item.quantity) || 0, c0 = Number(item.avg_cost) || 0
    if (form.type === 'entrada') {
      const c = Number(form.unit_cost) || c0
      const newQ = q0 + qty
      preview = { q: newQ, avg: (Math.max(q0, 0) * c0 + qty * c) / (Math.max(q0, 0) + qty) }
    } else if (form.type === 'saida') preview = { q: q0 - qty, avg: c0 }
    else preview = { q: qty, avg: c0 }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.item_id) return alert('Escolha o item.')
    setSaving(true)
    const { error } = await supabase.from('stock_movements').insert({
      item_id: form.item_id,
      type: form.type,
      quantity: qty,
      unit_cost: form.type === 'entrada' && form.unit_cost !== '' ? Number(form.unit_cost) : null,
      movement_date: form.movement_date || today(),
      supplier_id: form.type === 'entrada' && form.supplier_id ? form.supplier_id : null,
      reason: form.reason || null,
    })
    setSaving(false)
    if (error) return alert('Não foi possível registrar: ' + error.message)
    onSaved()
  }

  const filtered = items.filter(i => i.active && (!search || itemName(i).toLowerCase().includes(search.toLowerCase())))

  return (
    <Modal title="Registrar movimentação" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="segmented">
          {['entrada', 'saida', 'ajuste'].map(t => (
            <button type="button" key={t} className={form.type === t ? 'on' : ''} onClick={() => setForm({ ...form, type: t })}>
              {t === 'entrada' ? 'Entrada' : t === 'saida' ? 'Saída' : 'Ajuste'}
            </button>
          ))}
        </div>
        <p className="hint">
          {form.type === 'entrada' && 'Compra de material ou peça que ficou pronta. Informe o custo para calcular o custo médio.'}
          {form.type === 'saida' && 'Venda, uso na produção, perda ou presente.'}
          {form.type === 'ajuste' && 'Contou e o número está diferente? Informe a quantidade REAL que existe agora.'}
        </p>

        <label>Item *</label>
        {!initialItemId && (
          <input placeholder="Filtrar itens…" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 6 }} />
        )}
        <select required value={form.item_id} onChange={e => setForm({ ...form, item_id: e.target.value })}>
          <option value="">Escolha…</option>
          <optgroup label="Peças do catálogo">
            {filtered.filter(i => i.kind === 'peca').map(i => <option key={i.id} value={i.id}>{itemName(i)}</option>)}
          </optgroup>
          <optgroup label="Matéria-prima e materiais">
            {filtered.filter(i => i.kind === 'insumo').map(i => <option key={i.id} value={i.id}>{itemName(i)} ({i.unit})</option>)}
          </optgroup>
        </select>
        {item && <p className="hint">Saldo atual: <strong>{formatNumber(item.quantity)} {item.unit}</strong> · custo médio {formatMoney(item.avg_cost)}/{item.unit}</p>}

        <div className="row">
          <div>
            <label>{form.type === 'ajuste' ? `Quantidade real (${unit}) *` : `Quantidade (${unit}) *`}</label>
            <input required type="number" step="any" min="0" inputMode="decimal" value={form.quantity} onChange={e => setQty(e.target.value)} />
          </div>
          <div>
            <label>Data</label>
            <input type="date" value={form.movement_date} onChange={e => setForm({ ...form, movement_date: e.target.value })} />
          </div>
        </div>

        {form.type === 'entrada' && (
          <>
            <div className="row">
              <div>
                <label>Custo por {UNITS[unit] || unit} (R$)</label>
                <input type="number" step="any" min="0" inputMode="decimal" value={form.unit_cost} onChange={e => setUnitCost(e.target.value)} />
              </div>
              <div>
                <label>…ou custo total (R$)</label>
                <input type="number" step="0.01" min="0" inputMode="decimal" value={form.total_cost} onChange={e => setTotalCost(e.target.value)} />
              </div>
            </div>
            <label>Fornecedor</label>
            <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">—</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}

        <label>Motivo / observação</label>
        <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
          placeholder={form.type === 'saida' ? 'Ex.: venda para Marina, uso na produção' : form.type === 'ajuste' ? 'Ex.: contagem de novembro' : 'Ex.: compra NF 1234'} />

        {preview && (
          <div className={`preview-box${preview.q < 0 ? ' warn' : ''}`}>
            Depois desta movimentação: <strong>{formatNumber(preview.q)} {unit}</strong>
            {' · '}custo médio <strong>{formatMoney(preview.avg)}</strong>
            {preview.q < 0 && <div>Atenção: o saldo vai ficar negativo.</div>}
          </div>
        )}

        <button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Registrar'}</button>
      </form>
    </Modal>
  )
}
