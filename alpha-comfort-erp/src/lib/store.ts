import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ====== Tipos ======
export type Role = 'admin' | 'vendedor' | 'personalizado'
export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'CARTAO'
export type CartaoBandeira = 'Visa' | 'Mastercard' | 'Elo' | 'American Express' | 'Hipercard'
export type StatusPedido = 'Pendente' | 'Pago' | 'Em Separacao' | 'Em Entrega' | 'Concluido' | 'Cancelado'
export type StatusEntrega = 'Agendada' | 'Em Rota' | 'Entregue' | 'Falha'
export type OrigemPedido = 'Loja Fisica' | 'Mercado Livre' | 'Shopee' | 'Amazon' | 'Magalu' | 'Americanas'
export type MarketplaceId = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'americanas'

// Permissões por módulo
export type ModuloSistema =
  | 'dashboard' | 'pedidos' | 'clientes' | 'produtos' | 'estoque'
  | 'entregas' | 'notas' | 'marketplaces' | 'financeiro' | 'relatorios' | 'config'

export type Permissao = 'visualizar' | 'editar' | 'nenhuma'
export type PermissoesModulos = Record<ModuloSistema, Permissao>

export const PERMISSOES_POR_ROLE: Record<Role, PermissoesModulos> = {
  admin: {
    dashboard: 'editar', pedidos: 'editar', clientes: 'editar', produtos: 'editar',
    estoque: 'editar', entregas: 'editar', notas: 'editar', marketplaces: 'editar',
    financeiro: 'editar', relatorios: 'editar', config: 'editar',
  },
  vendedor: {
    dashboard: 'nenhuma', pedidos: 'editar', clientes: 'nenhuma', produtos: 'nenhuma',
    estoque: 'visualizar', entregas: 'editar', notas: 'nenhuma', marketplaces: 'nenhuma',
    financeiro: 'nenhuma', relatorios: 'nenhuma', config: 'nenhuma',
  },
  personalizado: {
    dashboard: 'nenhuma', pedidos: 'visualizar', clientes: 'nenhuma', produtos: 'nenhuma',
    estoque: 'nenhuma', entregas: 'nenhuma', notas: 'nenhuma', marketplaces: 'nenhuma',
    financeiro: 'nenhuma', relatorios: 'nenhuma', config: 'nenhuma',
  },
}

export interface MarketplaceConfig {
  id: MarketplaceId
  nome: string
  conectado: boolean
  sellerId?: string
  accessToken?: string
  status?: 'ativo' | 'pausado' | 'erro'
  totalProdutos?: number
  totalPedidos?: number
  ultimaSincronizacao?: string
  cor: string
  logo: string
  comissao: string
  descricao: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  senha: string
  role: Role
  ativo: boolean
  permissoes?: PermissoesModulos
}

export interface Cliente {
  id: string
  nome: string
  cpf: string
  telefone: string
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  complemento: string
  createdAt: string
}

export interface Produto {
  id: string
  modelo: string
  marca: string
  medida: string
  valorCompra: number
  valorVenda: number
  estoqueAtual: number
  estoqueMinimo: number
  ativo: boolean
}

export interface PedidoItem {
  id: string
  produtoId: string
  modelo: string
  marca: string
  medida: string
  quantidade: number
  valorUnitario: number
  subtotal: number
}

export interface Pedido {
  id: string
  numero: number
  clienteId: string
  clienteNome: string
  vendedorId: string
  vendedorNome: string
  data: string
  itens: PedidoItem[]
  formaPagamento: FormaPagamento
  status: StatusPedido
  subtotal: number
  desconto: number
  total: number
  observacoes: string
  precisaEntrega: boolean
  origem: OrigemPedido
  codigoExterno?: string
  parcelas?: number
  bandeiraCartao?: CartaoBandeira
  aceite?: {
    status: 'pendente' | 'aceito' | 'recusado'
    data?: string
    ip?: string
    userAgent?: string
    assinatura?: string
    tipo: 'presencial' | 'online'
  }
}

export interface Entrega {
  id: string
  pedidoId: string
  pedidoNumero: number
  clienteNome: string
  dataEntrega: string
  horario: string
  endereco: string
  status: StatusEntrega
  observacoes: string
}

export interface NotaFiscal {
  id: string
  pedidoId: string
  pedidoNumero: number
  clienteNome: string
  valor: number
  status: 'Pendente' | 'Autorizada' | 'Rejeitada'
  chave: string
  data: string
}

// ====== Store ======
interface AppState {
  // Auth
  usuarioLogado: Usuario | null
  login: (email: string, senha: string) => boolean
  logout: () => void

  // Dados
  usuarios: Usuario[]
  clientes: Cliente[]
  produtos: Produto[]
  pedidos: Pedido[]
  entregas: Entrega[]
  notasFiscais: NotaFiscal[]
  marketplaces: MarketplaceConfig[]
  contas: Conta[]
  taxasBandeiras: TaxaBandeira[]
  configFinanceira: ConfigFinanceira
  dadosEmpresa: DadosEmpresa

  // CRUD Clientes
  addCliente: (c: Omit<Cliente, 'id' | 'createdAt'>) => void
  updateCliente: (id: string, c: Partial<Cliente>) => void
  removeCliente: (id: string) => void

  // CRUD Produtos
  addProduto: (p: Omit<Produto, 'id'>) => void
  updateProduto: (id: string, p: Partial<Produto>) => void
  removeProduto: (id: string) => void

  // CRUD Usuários
  addUsuario: (u: Omit<Usuario, 'id'>) => void
  updateUsuario: (id: string, u: Partial<Usuario>) => void
  removeUsuario: (id: string) => void

  // Pedidos
  addPedido: (p: Omit<Pedido, 'id' | 'numero' | 'data'>) => void
  updatePedidoStatus: (id: string, status: StatusPedido) => void
  registrarAceite: (pedidoId: string, dados: { status: 'aceito' | 'recusado'; ip?: string; userAgent?: string; assinatura?: string; tipo: 'presencial' | 'online' }) => void
  removePedido: (id: string) => void

  // Entregas
  addEntrega: (e: Omit<Entrega, 'id'>) => void
  updateEntregaStatus: (id: string, status: StatusEntrega) => void

  // NF-e
  emitirNfe: (pedidoId: string) => void

  // Estoque
  ajustarEstoque: (produtoId: string, quantidade: number, motivo: string) => void

  // Marketplaces
  updateMarketplace: (id: MarketplaceId, data: Partial<MarketplaceConfig>) => void
  receberPedidoMarketplace: (pedido: {
    origem: OrigemPedido
    clienteNome: string
    produtoId: string
    quantidade: number
    valorUnitario: number
    codigoExterno: string
  }) => void

  // Financeiro
  addConta: (c: Omit<Conta, 'id' | 'createdAt'>) => void
  updateConta: (id: string, c: Partial<Conta>) => void
  removeConta: (id: string) => void
  updateTaxaBandeira: (bandeira: CartaoBandeira, data: Partial<TaxaBandeira>) => void
  updateConfigFinanceira: (data: Partial<ConfigFinanceira>) => void
  updateDadosEmpresa: (data: Partial<DadosEmpresa>) => void
}

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

// ====== Dados iniciais ======
const usuariosIniciais: Usuario[] = [
  { id: 'u1', nome: 'Administrador', email: 'admin@alpha.com', senha: '123456', role: 'admin', ativo: true },
  { id: 'u2', nome: 'João Vendedor', email: 'vendedor@alpha.com', senha: '123456', role: 'vendedor', ativo: true },
]

const clientesIniciais: Cliente[] = [
  {
    id: 'c1', nome: 'Maria Silva', cpf: '123.456.789-00', telefone: '(11) 98765-4321',
    cep: '01001-000', rua: 'Praça da Sé', numero: '100', bairro: 'Sé', cidade: 'São Paulo', estado: 'SP',
    complemento: 'Apto 5', createdAt: '2025-09-15T10:00:00Z'
  },
  {
    id: 'c2', nome: 'José Santos', cpf: '987.654.321-00', telefone: '(21) 91234-5678',
    cep: '20040-020', rua: 'Avenida Rio Branco', numero: '45', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ',
    complemento: '', createdAt: '2025-10-01T14:30:00Z'
  },
  {
    id: 'c3', nome: 'Ana Oliveira', cpf: '456.789.123-00', telefone: '(31) 99876-5432',
    cep: '30130-100', rua: 'Avenida Afonso Pena', numero: '200', bairro: 'Centro', cidade: 'Belo Horizonte', estado: 'MG',
    complemento: 'Casa', createdAt: '2025-10-10T09:15:00Z'
  },
]

const produtosIniciais: Produto[] = [
  { id: 'p1', modelo: 'Premium Viscoelástico', marca: 'Castor', medida: 'Casal 138x188cm', valorCompra: 850, valorVenda: 1599, estoqueAtual: 12, estoqueMinimo: 5, ativo: true },
  { id: 'p2', modelo: 'Orthopedic Plus', marca: 'Probel', medida: 'Queen 158x198cm', valorCompra: 1100, valorVenda: 2199, estoqueAtual: 8, estoqueMinimo: 5, ativo: true },
  { id: 'p3', modelo: 'Comfort Molas', marca: 'BS Colchões', medida: 'Solteiro 88x188cm', valorCompra: 450, valorVenda: 899, estoqueAtual: 4, estoqueMinimo: 5, ativo: true },
  { id: 'p4', modelo: 'Luxury Pocket', marca: 'Ortobom', medida: 'King 193x203cm', valorCompra: 1500, valorVenda: 2999, estoqueAtual: 6, estoqueMinimo: 3, ativo: true },
  { id: 'p5', modelo: 'Eco Bamboo', marca: 'Probel', medida: 'Casal 138x188cm', valorCompra: 720, valorVenda: 1399, estoqueAtual: 3, estoqueMinimo: 5, ativo: true },
  { id: 'p6', modelo: 'Master Visco', marca: 'Castor', medida: 'Queen 158x198cm', valorCompra: 980, valorVenda: 1899, estoqueAtual: 10, estoqueMinimo: 5, ativo: true },
]

const pedidosIniciais: Pedido[] = [
  {
    id: 'ped1', numero: 1001, clienteId: 'c1', clienteNome: 'Maria Silva',
    vendedorId: 'u2', vendedorNome: 'João Vendedor',
    data: '2025-10-12T15:30:00Z',
    itens: [
      { id: 'i1', produtoId: 'p1', modelo: 'Premium Viscoelástico', marca: 'Castor', medida: 'Casal 138x188cm', quantidade: 1, valorUnitario: 1599, subtotal: 1599 },
    ],
    formaPagamento: 'CARTAO', status: 'Concluido', subtotal: 1599, desconto: 0, total: 1599,
    observacoes: 'Cliente satisfeito', precisaEntrega: true,
  },
  {
    id: 'ped2', numero: 1002, clienteId: 'c2', clienteNome: 'José Santos',
    vendedorId: 'u1', vendedorNome: 'Administrador',
    data: '2025-10-15T11:00:00Z',
    itens: [
      { id: 'i2', produtoId: 'p3', modelo: 'Comfort Molas', marca: 'BS Colchões', medida: 'Solteiro 88x188cm', quantidade: 2, valorUnitario: 899, subtotal: 1798 },
      { id: 'i3', produtoId: 'p5', modelo: 'Eco Bamboo', marca: 'Probel', medida: 'Casal 138x188cm', quantidade: 1, valorUnitario: 1399, subtotal: 1399 },
    ],
    formaPagamento: 'PIX', status: 'Em Entrega', subtotal: 3197, desconto: 100, total: 3097,
    observacoes: '', precisaEntrega: true,
  },
  {
    id: 'ped3', numero: 1003, clienteId: 'c3', clienteNome: 'Ana Oliveira',
    vendedorId: 'u2', vendedorNome: 'João Vendedor',
    data: '2025-10-18T16:45:00Z',
    itens: [
      { id: 'i4', produtoId: 'p2', modelo: 'Orthopedic Plus', marca: 'Probel', medida: 'Queen 158x198cm', quantidade: 1, valorUnitario: 2199, subtotal: 2199 },
    ],
    formaPagamento: 'DINHEIRO', status: 'Pago', subtotal: 2199, desconto: 0, total: 2199,
    observacoes: 'Entregar segunda-feira', precisaEntrega: true,
  },
]

const entregasIniciais: Entrega[] = [
  { id: 'e1', pedidoId: 'ped2', pedidoNumero: 1002, clienteNome: 'José Santos', dataEntrega: '2025-10-19', horario: '09:00', endereco: 'Avenida Rio Branco, 45 - Centro, Rio de Janeiro - RJ', status: 'Agendada', observacoes: 'Predio, apt 302' },
  { id: 'e2', pedidoId: 'ped3', pedidoNumero: 1003, clienteNome: 'Ana Oliveira', dataEntrega: '2025-10-20', horario: '14:00', endereco: 'Avenida Afonso Pena, 200 - Centro, Belo Horizonte - MG', status: 'Agendada', observacoes: '' },
]

const notasIniciais: NotaFiscal[] = [
  { id: 'n1', pedidoId: 'ped1', pedidoNumero: 1001, clienteNome: 'Maria Silva', valor: 1599, status: 'Autorizada', chave: '35251000000000000100000001000010000000001234', data: '2025-10-12T15:35:00Z' },
]

// ====== Taxas de cartão por bandeira (4 faixas) ======
export interface TaxaBandeira {
  bandeira: CartaoBandeira
  taxaDebito: number
  taxaCredito1x: number
  taxaCredito2a6: number
  taxaCredito7a12: number
  taxaCredito13a18: number
}

export const TAXAS_BANDEIRAS: TaxaBandeira[] = [
  { bandeira: 'Visa', taxaDebito: 1.99, taxaCredito1x: 3.49, taxaCredito2a6: 4.49, taxaCredito7a12: 5.99, taxaCredito13a18: 7.49 },
  { bandeira: 'Mastercard', taxaDebito: 1.99, taxaCredito1x: 3.49, taxaCredito2a6: 4.49, taxaCredito7a12: 5.99, taxaCredito13a18: 7.49 },
  { bandeira: 'Elo', taxaDebito: 2.19, taxaCredito1x: 3.79, taxaCredito2a6: 4.79, taxaCredito7a12: 6.29, taxaCredito13a18: 7.79 },
  { bandeira: 'American Express', taxaDebito: 2.99, taxaCredito1x: 4.99, taxaCredito2a6: 5.99, taxaCredito7a12: 7.49, taxaCredito13a18: 8.99 },
  { bandeira: 'Hipercard', taxaDebito: 2.49, taxaCredito1x: 4.29, taxaCredito2a6: 5.29, taxaCredito7a12: 6.79, taxaCredito13a18: 8.29 },
]

// ====== Tipos financeiros ======
export type TipoConta = 'pagar' | 'receber'
export type StatusConta = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type CategoriaConta = 'aluguel' | 'salarios' | 'impostos' | 'fornecedores' | 'energia' | 'internet' | 'marketing' | 'comissoes' | 'outros'

export interface Conta {
  id: string
  tipo: TipoConta
  descricao: string
  categoria: CategoriaConta
  valor: number
  vencimento: string
  status: StatusConta
  dataPagamento?: string
  observacoes?: string
  formaPagamento?: FormaPagamento
  createdAt: string
}

export interface ConfigFinanceira {
  comissaoVendedorPercent: number
  lucroDono: number
}

export interface DadosEmpresa {
  logo: string
  nomeEmpresa: string
  cnpj: string
  inscricaoEstadual: string
  telefone: string
  email: string
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
}

const marketplacesIniciais: MarketplaceConfig[] = [
  { id: 'mercadolivre', nome: 'Mercado Livre', conectado: true, sellerId: '678901234', accessToken: 'APP_USR_***', status: 'ativo', totalProdutos: 4, totalPedidos: 1, ultimaSincronizacao: '2025-10-19T08:30:00Z', cor: '#FFE600', logo: '🛒', comissao: '12-20%', descricao: 'O maior marketplace da América Latina.' },
  { id: 'shopee', nome: 'Shopee', conectado: true, sellerId: 'SHP998877', accessToken: 'shopee_***', status: 'ativo', totalProdutos: 4, totalPedidos: 1, ultimaSincronizacao: '2025-10-19T08:30:00Z', cor: '#EE4D2D', logo: '🛍', comissao: '6-20%', descricao: 'Marketplace em ascensão no Brasil.' },
  { id: 'amazon', nome: 'Amazon Brasil', conectado: false, cor: '#FF9900', logo: '📦', comissao: '4-15%', descricao: 'Marketplace global com entrega Prime.' },
  { id: 'magalu', nome: 'Magazine Luiza', conectado: false, cor: '#0086FF', logo: '🔵', comissao: '10-15%', descricao: 'Um dos maiores varejistas do Brasil.' },
  { id: 'americanas', nome: 'Americanas', conectado: false, cor: '#E60026', logo: '🔴', comissao: '12-18%', descricao: 'Rede de varejo tradicional.' },
]

const contasIniciais: Conta[] = [
  { id: 'conta1', tipo: 'pagar', descricao: 'Aluguel da loja - Outubro', categoria: 'aluguel', valor: 4500, vencimento: '2025-10-10', status: 'pago', dataPagamento: '2025-10-09', formaPagamento: 'PIX', observacoes: 'Aluguel mensal', createdAt: '2025-10-01T10:00:00Z' },
  { id: 'conta2', tipo: 'pagar', descricao: 'Conta de energia elétrica', categoria: 'energia', valor: 680, vencimento: '2025-10-25', status: 'pendente', createdAt: '2025-10-15T11:00:00Z' },
  { id: 'conta3', tipo: 'pagar', descricao: 'Internet + Telefone', categoria: 'internet', valor: 180, vencimento: '2025-10-22', status: 'pendente', createdAt: '2025-10-15T11:00:00Z' },
  { id: 'conta4', tipo: 'pagar', descricao: 'Salário vendedor João', categoria: 'salarios', valor: 2200, vencimento: '2025-10-30', status: 'pendente', createdAt: '2025-10-15T11:00:00Z' },
  { id: 'conta5', tipo: 'pagar', descricao: 'Pagamento fornecedor Castor', categoria: 'fornecedores', valor: 5800, vencimento: '2025-10-28', status: 'pendente', createdAt: '2025-10-12T11:00:00Z' },
  { id: 'conta6', tipo: 'pagar', descricao: 'Simples Nacional - Setembro', categoria: 'impostos', valor: 1240, vencimento: '2025-10-20', status: 'atrasado', createdAt: '2025-10-01T11:00:00Z' },
  { id: 'conta7', tipo: 'pagar', descricao: 'Facebook Ads', categoria: 'marketing', valor: 350, vencimento: '2025-10-15', status: 'pago', dataPagamento: '2025-10-14', formaPagamento: 'CARTAO', createdAt: '2025-10-10T11:00:00Z' },
  { id: 'conta8', tipo: 'receber', descricao: 'Pedido #1001 - Maria Silva', categoria: 'outros', valor: 1599, vencimento: '2025-11-12', status: 'pendente', createdAt: '2025-10-12T15:30:00Z' },
  { id: 'conta9', tipo: 'receber', descricao: 'Pedido #1002 - José Santos', categoria: 'outros', valor: 3097, vencimento: '2025-10-15', status: 'pago', dataPagamento: '2025-10-15', formaPagamento: 'PIX', createdAt: '2025-10-15T11:00:00Z' },
  { id: 'conta10', tipo: 'receber', descricao: 'Pedido #1003 - Ana Oliveira', categoria: 'outros', valor: 2199, vencimento: '2025-10-18', status: 'pago', dataPagamento: '2025-10-18', formaPagamento: 'DINHEIRO', createdAt: '2025-10-18T16:45:00Z' },
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  usuarioLogado: null,
  usuarios: usuariosIniciais,
  clientes: clientesIniciais,
  produtos: produtosIniciais,
  pedidos: pedidosIniciais,
  entregas: entregasIniciais,
  notasFiscais: notasIniciais,
  marketplaces: marketplacesIniciais,
  contas: contasIniciais,
  taxasBandeiras: TAXAS_BANDEIRAS,
  configFinanceira: {
    comissaoVendedorPercent: 5,
    lucroDono: 0,
  },
  dadosEmpresa: {
    logo: '',
    nomeEmpresa: 'Alpha Comfort Colchões',
    cnpj: '12.345.678/0001-90',
    inscricaoEstadual: '123.456.789.000',
    telefone: '(11) 3000-0000',
    email: 'contato@alphacomfort.com.br',
    cep: '01001-000',
    rua: 'Rua das Colchas',
    numero: '123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
  },

  login: (email, senha) => {
    const user = get().usuarios.find(u => u.email === email && u.senha === senha && u.ativo)
    if (user) {
      set({ usuarioLogado: user })
      return true
    }
    return false
  },

  logout: () => set({ usuarioLogado: null }),

  addCliente: (c) => set(state => ({
    clientes: [{ ...c, id: uid(), createdAt: new Date().toISOString() }, ...state.clientes]
  })),

  updateCliente: (id, c) => set(state => ({
    clientes: state.clientes.map(cl => cl.id === id ? { ...cl, ...c } : cl)
  })),

  removeCliente: (id) => set(state => ({
    clientes: state.clientes.filter(c => c.id !== id)
  })),

  addProduto: (p) => set(state => ({
    produtos: [{ ...p, id: uid() }, ...state.produtos]
  })),

  updateProduto: (id, p) => set(state => ({
    produtos: state.produtos.map(pr => pr.id === id ? { ...pr, ...p } : pr)
  })),

  removeProduto: (id) => set(state => ({
    produtos: state.produtos.filter(p => p.id !== id)
  })),

  addPedido: (p) => set(state => {
    const numero = state.pedidos.length > 0 ? Math.max(...state.pedidos.map(x => x.numero)) + 1 : 1001
    const novoPedido: Pedido = {
      ...p, id: uid(), numero, data: new Date().toISOString()
    }
    // Dar baixa no estoque
    const produtosAtualizados = state.produtos.map(prod => {
      const item = p.itens.find(i => i.produtoId === prod.id)
      if (item) {
        return { ...prod, estoqueAtual: prod.estoqueAtual - item.quantidade }
      }
      return prod
    })
    return { pedidos: [novoPedido, ...state.pedidos], produtos: produtosAtualizados }
  }),

  updatePedidoStatus: (id, status) => set(state => ({
    pedidos: state.pedidos.map(p => p.id === id ? { ...p, status } : p)
  })),

  removePedido: (id) => set(state => ({
    pedidos: state.pedidos.filter(p => p.id !== id)
  })),

  addEntrega: (e) => set(state => ({
    entregas: [{ ...e, id: uid() }, ...state.entregas]
  })),

  updateEntregaStatus: (id, status) => set(state => ({
    entregas: state.entregas.map(e => e.id === id ? { ...e, status } : e)
  })),

  emitirNfe: (pedidoId) => set(state => {
    const pedido = state.pedidos.find(p => p.id === pedidoId)
    if (!pedido) return state
    const jaExiste = state.notasFiscais.some(n => n.pedidoId === pedidoId)
    if (jaExiste) return state
    const nova: NotaFiscal = {
      id: uid(),
      pedidoId: pedido.id,
      pedidoNumero: pedido.numero,
      clienteNome: pedido.clienteNome,
      valor: pedido.total,
      status: 'Autorizada',
      chave: Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join(''),
      data: new Date().toISOString(),
    }
    return { notasFiscais: [nova, ...state.notasFiscais] }
  }),

  ajustarEstoque: (produtoId, quantidade, _motivo) => set(state => ({
    produtos: state.produtos.map(p =>
      p.id === produtoId ? { ...p, estoqueAtual: p.estoqueAtual + quantidade } : p
    )
  })),

  // ====== Usuários ======
  addUsuario: (u) => set(state => ({
    usuarios: [...state.usuarios, { ...u, id: uid() }]
  })),

  updateUsuario: (id, u) => set(state => ({
    usuarios: state.usuarios.map(us => us.id === id ? { ...us, ...u } : us),
    usuarioLogado: state.usuarioLogado?.id === id ? { ...state.usuarioLogado, ...u } : state.usuarioLogado,
  })),

  removeUsuario: (id) => set(state => ({
    usuarios: state.usuarios.filter(u => u.id !== id)
  })),

  // ====== Marketplaces ======
  updateMarketplace: (id, data) => set(state => ({
    marketplaces: state.marketplaces.map(m => m.id === id ? { ...m, ...data } : m)
  })),

  receberPedidoMarketplace: (info) => set(state => {
    const produto = state.produtos.find(p => p.id === info.produtoId)
    if (!produto) return state
    const numero = state.pedidos.length > 0 ? Math.max(...state.pedidos.map(x => x.numero)) + 1 : 1001
    const subtotal = info.valorUnitario * info.quantidade
    const novoPedido: Pedido = {
      id: uid(),
      numero,
      clienteId: 'mk_' + uid(),
      clienteNome: info.clienteNome,
      vendedorId: 'sistema',
      vendedorNome: 'Sistema (Marketplace)',
      data: new Date().toISOString(),
      itens: [{
        id: uid(),
        produtoId: produto.id,
        modelo: produto.modelo,
        marca: produto.marca,
        medida: produto.medida,
        quantidade: info.quantidade,
        valorUnitario: info.valorUnitario,
        subtotal,
      }],
      formaPagamento: 'CARTAO',
      status: 'Pendente',
      subtotal,
      desconto: 0,
      total: subtotal,
      observacoes: `Pedido recebido via ${info.origem} - ${info.codigoExterno}`,
      precisaEntrega: true,
      origem: info.origem,
      codigoExterno: info.codigoExterno,
      bandeiraCartao: ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'][Math.floor(Math.random() * 5)] as CartaoBandeira,
    }
    const produtosAtualizados = state.produtos.map(p =>
      p.id === produto.id ? { ...p, estoqueAtual: Math.max(0, p.estoqueAtual - info.quantidade) } : p
    )
    const marketplacesAtualizados = state.marketplaces.map(m =>
      m.id === mapOrigemToId(info.origem)
        ? { ...m, totalPedidos: (m.totalPedidos || 0) + 1, ultimaSincronizacao: new Date().toISOString() }
        : m
    )
    return {
      pedidos: [novoPedido, ...state.pedidos],
      produtos: produtosAtualizados,
      marketplaces: marketplacesAtualizados,
    }
  }),

  // ====== Aceite ======
  registrarAceite: (pedidoId, dados) => set(state => ({
    pedidos: state.pedidos.map(p => p.id === pedidoId ? {
      ...p,
      aceite: {
        status: dados.status,
        data: new Date().toISOString(),
        ip: dados.ip,
        userAgent: dados.userAgent,
        assinatura: dados.assinatura,
        tipo: dados.tipo,
      }
    } : p)
  })),

  // ====== Financeiro ======
  updateTaxaBandeira: (bandeira, data) => set(state => ({
    taxasBandeiras: state.taxasBandeiras.map(t => t.bandeira === bandeira ? { ...t, ...data } : t)
  })),

  updateConfigFinanceira: (data) => set(state => ({
    configFinanceira: { ...state.configFinanceira, ...data }
  })),

  updateDadosEmpresa: (data) => set(state => ({
    dadosEmpresa: { ...state.dadosEmpresa, ...data }
  })),

      // Nome da chave no localStorage
      name: 'alpha-comfort-erp',
      storage: createJSONStorage(() => localStorage),
      // Não salvar usuarioLogado (precisa fazer login sempre)
      partialize: (state) => ({
        usuarios: state.usuarios,
        clientes: state.clientes,
        produtos: state.produtos,
        pedidos: state.pedidos,
        entregas: state.entregas,
        notasFiscais: state.notasFiscais,
        marketplaces: state.marketplaces,
        contas: state.contas,
        taxasBandeiras: state.taxasBandeiras,
        configFinanceira: state.configFinanceira,
        dadosEmpresa: state.dadosEmpresa,
      }),
    })
  )
)

function mapOrigemToId(origem: OrigemPedido): MarketplaceId {
  switch (origem) {
    case 'Mercado Livre': return 'mercadolivre'
    case 'Shopee': return 'shopee'
    case 'Amazon': return 'amazon'
    case 'Magalu': return 'magalu'
    case 'Americanas': return 'americanas'
    default: return 'mercadolivre'
  }
}
