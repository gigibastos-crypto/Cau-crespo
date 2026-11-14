import { supabase } from './supabaseClient'
import { today } from './format'

export const PAYMENT_METHODS = {
  pix: 'PIX',
  boleto: 'Boleto',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
  outro: 'Outro',
}

// Nomes das categorias antigas (antes de virarem editáveis)
const LEGACY = { materia_prima: 'Matéria-prima', ferramentas: 'Ferramentas', embalagem: 'Embalagem', marketing: 'Marketing', outro: 'Outro' }

export function categoryName(expense, categoriesById) {
  return categoriesById[expense.category_id]?.name || LEGACY[expense.category] || 'Sem categoria'
}

// Situação de uma conta: paga, vencida, vence hoje, a vencer
export function expenseState(e, todayIso = today()) {
  if (e.status === 'pago') return 'pago'
  if (!e.due_date) return 'aberto'
  if (e.due_date < todayIso) return 'vencida'
  if (e.due_date === todayIso) return 'hoje'
  return 'aberto'
}

export const STATE_LABELS = { pago: 'Paga', vencida: 'Vencida', hoje: 'Vence hoje', aberto: 'A pagar' }

export async function loadFinanceLookups() {
  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from('expense_categories').select('*').order('name'),
    supabase.from('suppliers').select('id, name, active').order('name'),
  ])
  return {
    categories: categories ?? [],
    suppliers: suppliers ?? [],
    categoriesById: Object.fromEntries((categories ?? []).map(c => [c.id, c])),
    suppliersById: Object.fromEntries((suppliers ?? []).map(s => [s.id, s])),
  }
}
