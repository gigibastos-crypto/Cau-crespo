export const DELIVERY_METHODS = {
  retirada: 'Retirada no ateliê',
  motoboy: 'Motoboy',
  correios: 'Correios',
  outro: 'Outro',
}

export function whatsappLink(phone, text) {
  const digits = (phone || '').replace(/\D/g, '')
  if (digits.length < 10) return null
  const base = `https://wa.me/${digits.length <= 11 ? '55' + digits : digits}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

// Endereço da cliente em uma linha, a partir do cadastro
export function clientAddress(c) {
  if (!c) return ''
  const line1 = [c.street, c.address_number].filter(Boolean).join(', ')
  const parts = [line1, c.complement, c.neighborhood, [c.city, c.state].filter(Boolean).join('/'), c.cep && `CEP ${c.cep}`]
  return parts.filter(Boolean).join(' — ')
}
