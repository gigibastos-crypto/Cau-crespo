import { supabase } from './supabaseClient'

export const UNITS = { un: 'unidade', g: 'grama', kg: 'quilo', m: 'metro', cm: 'centímetro', par: 'par', pct: 'pacote', ml: 'ml' }
export const MOVE_LABELS = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste de contagem' }

export function itemName(item) {
  return item.products?.name || item.name || '—'
}

// Carrega itens de estoque com dados do catálogo (nome, foto, preço de venda)
export async function loadStockItems() {
  const { data, error } = await supabase
    .from('stock_items')
    .select('*, products(name, collection, price, photo_url, status)')
  if (error) throw error
  return (data ?? []).sort((a, b) => itemName(a).localeCompare(itemName(b), 'pt-BR'))
}
