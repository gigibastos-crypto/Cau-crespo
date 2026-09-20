export function formatMoney(value) {
  const n = Number(value) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('pt-BR')
}
