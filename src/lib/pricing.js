// Contas da precificação (mesma regra da função product_unit_cost no banco)

export const DEFAULT_PRICING = { labor_hours: '', hourly_rate: '', target_margin: 50, fees_pct: 0, notes: '' }

export function lineCost(line, stockById) {
  const unit = line.unit_cost !== '' && line.unit_cost != null
    ? Number(line.unit_cost)
    : Number(stockById[line.stock_item_id]?.avg_cost) || 0
  return (Number(line.quantity) || 0) * unit
}

export function costBreakdown(lines, pricing, stockById) {
  const materials = lines.reduce((s, l) => s + lineCost(l, stockById), 0)
  const labor = (Number(pricing.labor_hours) || 0) * (Number(pricing.hourly_rate) || 0)
  return { materials, labor, total: materials + labor }
}

// Preço em que, depois das taxas, sobra a margem desejada
export function suggestedPrice(cost, marginPct, feesPct) {
  const keep = 1 - ((Number(marginPct) || 0) + (Number(feesPct) || 0)) / 100
  if (!cost || keep <= 0) return null
  return cost / keep
}

// Quanto do preço sobra de lucro, já descontadas as taxas (em %)
export function marginPct(price, cost, feesPct = 0) {
  price = Number(price)
  if (!price || cost == null) return null
  return ((price * (1 - (Number(feesPct) || 0) / 100) - cost) / price) * 100
}

export function formatPct(v) {
  if (v == null || !isFinite(v)) return '—'
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

export function marginClass(v, target = 30) {
  if (v == null) return ''
  if (v < 0) return 'danger-text'
  if (v < target) return 'warn-text'
  return 'positive-text'
}
