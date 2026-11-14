export function formatMoney(value) {
  const n = Number(value) || 0
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''))
  return d.toLocaleDateString('pt-BR')
}

// Número no formato brasileiro (ex.: 1.234,5)
export function formatNumber(value, maxDecimals = 3) {
  const n = Number(value) || 0
  return n.toLocaleString('pt-BR', { maximumFractionDigits: maxDecimals })
}

// Data no fuso local, AAAA-MM-DD. (toISOString() usa o horário de Londres:
// depois das 21h no Brasil devolveria o dia seguinte.)
export function toISODate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today() {
  return toISODate(new Date())
}

export function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function addMonths(iso, months) {
  const d = new Date(iso + 'T00:00:00')
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return toISODate(d)
}

export const PERIODS = {
  mes: 'Este mês',
  mes_passado: 'Mês passado',
  proximo_mes: 'Próximo mês',
  trimestre: 'Últimos 3 meses',
  ano: 'Este ano',
  tudo: 'Tudo',
  personalizado: 'Escolher datas…',
}

export function periodBounds(period, custom = {}) {
  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()
  const range = (a, b) => ({ start: toISODate(a), end: toISODate(b) })
  switch (period) {
    case 'mes_passado': return range(new Date(y, m - 1, 1), new Date(y, m, 0))
    case 'proximo_mes': return range(new Date(y, m + 1, 1), new Date(y, m + 2, 0))
    case 'trimestre': return range(new Date(y, m - 2, 1), new Date(y, m + 1, 0))
    case 'ano': return range(new Date(y, 0, 1), new Date(y, 11, 31))
    case 'tudo': return { start: '0000-01-01', end: '9999-12-31' }
    case 'personalizado': return { start: custom.start || '0000-01-01', end: custom.end || '9999-12-31' }
    default: return range(new Date(y, m, 1), new Date(y, m + 1, 0))
  }
}
