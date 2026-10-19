export const maskCPF = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)

export const maskTelefone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  if (digits.length > 2) {
    return digits.replace(/(\d{2})(\d+)/, '($1) $2')
  }
  return digits
}

export const maskCEP = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9)

export const maskNumber = (value: string) => {
  const digits = value.replace(/\D/g, '')
  return digits
}

export const formatMoeda = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatData = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export const formatDataCurta = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR')
}

export interface ViaCepResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function buscarCep(cep: string): Promise<ViaCepResponse | null> {
  const cepLimpo = cep.replace(/\D/g, '')
  if (cepLimpo.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    const data: ViaCepResponse = await response.json()
    if (data.erro) return null
    return data
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return null
  }
}
