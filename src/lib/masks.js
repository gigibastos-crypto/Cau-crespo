export function formatCPF(value) {
  return (value || '')
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function formatCEP(value) {
  return (value || '')
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export async function lookupCEP(cep) {
  const digits = (cep || '').replace(/\D/g, '')
  if (digits.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  const data = await res.json()
  if (data.erro) return null
  return { street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }
}
