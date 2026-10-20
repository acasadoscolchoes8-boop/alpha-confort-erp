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

// ====== Cálculo de taxas de cartão e lucro líquido ======
export interface ResultadoTaxa {
  taxaPercentual: number
  valorTaxa: number
  valorLiquido: number
  faixa: string
}

export function calcularTaxaCartao(
  formaPagamento: string,
  bandeira: string | undefined,
  parcelas: number | undefined,
  valor: number,
  taxas: {
    bandeira: string
    taxaDebito: number
    taxaCredito1x: number
    taxaCredito2a6: number
    taxaCredito7a12: number
    taxaCredito13a18: number
  }[]
): ResultadoTaxa {
  if (formaPagamento !== 'CARTAO') {
    return { taxaPercentual: 0, valorTaxa: 0, valorLiquido: valor, faixa: 'Sem taxa' }
  }
  if (!bandeira) {
    return { taxaPercentual: 0, valorTaxa: 0, valorLiquido: valor, faixa: 'Sem bandeira' }
  }
  const taxaConfig = taxas.find(t => t.bandeira === bandeira)
  if (!taxaConfig) {
    return { taxaPercentual: 0, valorTaxa: 0, valorLiquido: valor, faixa: 'Bandeira não configurada' }
  }
  const p = parcelas || 1
  let taxaPercentual: number
  let faixa: string
  if (p <= 1) {
    taxaPercentual = taxaConfig.taxaCredito1x
    faixa = 'Crédito à vista (1x)'
  } else if (p <= 6) {
    taxaPercentual = taxaConfig.taxaCredito2a6
    faixa = 'Parcelado 2x a 6x'
  } else if (p <= 12) {
    taxaPercentual = taxaConfig.taxaCredito7a12
    faixa = 'Parcelado 7x a 12x'
  } else {
    taxaPercentual = taxaConfig.taxaCredito13a18
    faixa = 'Parcelado 13x a 18x'
  }
  const valorTaxa = (valor * taxaPercentual) / 100
  const valorLiquido = valor - valorTaxa
  return { taxaPercentual, valorTaxa, valorLiquido, faixa }
}
