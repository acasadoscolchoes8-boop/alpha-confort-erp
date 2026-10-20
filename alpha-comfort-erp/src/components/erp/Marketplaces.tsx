'use client'

import { useState } from 'react'
import { useStore, type MarketplaceConfig, type MarketplaceId, type OrigemPedido } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Zap, RefreshCw, CheckCircle, XCircle, Link2, Unlink, TrendingUp, Package, ShoppingCart, Settings, Activity, Sparkles } from 'lucide-react'
import { formatData } from '@/lib/utils-format'
import { toast } from 'sonner'

export function Marketplaces() {
  const { marketplaces, produtos, pedidos, updateMarketplace, receberPedidoMarketplace } = useStore()
  const [modalConfig, setModalConfig] = useState<MarketplaceId | null>(null)
  const [modalSimular, setModalSimular] = useState(false)
  const [simOrigem, setSimOrigem] = useState<OrigemPedido>('Mercado Livre')
  const [simCliente, setSimCliente] = useState('')
  const [simProduto, setSimProduto] = useState('')
  const [simQtd, setSimQtd] = useState(1)
  const [sincronizando, setSincronizando] = useState<string | null>(null)

  const mkSelecionado = marketplaces.find(m => m.id === modalConfig)
  const produtosOnline = produtos.filter(p => p.venderOnline)
  const pedidosPorOrigem = (origem: OrigemPedido) => pedidos.filter(p => p.origem === origem)

  const confirmarConexao = () => {
    if (!mkSelecionado) return
    updateMarketplace(mkSelecionado.id, {
      conectado: true,
      status: 'ativo',
      sellerId: 'SIMULADO_' + Date.now(),
      accessToken: 'token_simulado_***',
      ultimaSincronizacao: new Date().toISOString(),
      totalProdutos: produtosOnline.length,
    })
    toast.success(`${mkSelecionado.nome} conectado!`)
    setModalConfig(null)
  }

  const desconectar = (m: MarketplaceConfig) => {
    if (!confirm(`Desconectar ${m.nome}?`)) return
    updateMarketplace(m.id, { conectado: false, status: 'pausado' })
    toast.success(`${m.nome} desconectado`)
  }

  const sincronizar = async (m: MarketplaceConfig) => {
    setSincronizando(m.id)
    await new Promise(r => setTimeout(r, 1200))
    updateMarketplace(m.id, {
      ultimaSincronizacao: new Date().toISOString(),
      totalProdutos: produtosOnline.length,
    })
    toast.success(`${m.nome} sincronizado!`)
    setSincronizando(null)
  }

  const simularPedido = () => {
    if (!simCliente.trim()) { toast.error('Digite o nome do cliente'); return }
    if (!simProduto) { toast.error('Selecione um produto'); return }
    const produto = produtos.find(p => p.id === simProduto)
    if (!produto) return
    const id = mapOrigemToId(simOrigem)
    const mk = marketplaces.find(m => m.id === id)
    if (!mk || !mk.conectado) { toast.error(`${simOrigem} não está conectado`); return }
    const preco = produto.precosMarketplace?.[id] || produto.valorVenda
    const codigoExterno = `${id.toUpperCase()}-${Math.floor(Math.random() * 900000 + 100000)}`
    receberPedidoMarketplace({
      origem: simOrigem,
      clienteNome: simCliente,
      produtoId: produto.id,
      quantidade: simQtd,
      valorUnitario: preco,
      codigoExterno,
    })
    toast.success(`🚀 Novo pedido via ${simOrigem}!`)
    setModalSimular(false)
    setSimCliente('')
    setSimProduto('')
    setSimQtd(1)
  }

  const totalConectados = marketplaces.filter(m => m.conectado).length
  const totalPedidosMarketplace = pedidos.filter(p => p.origem !== 'Loja Fisica').length
  const totalVendasMarketplace = pedidos.filter(p => p.origem !== 'Loja Fisica' && p.status !== 'Cancelado').reduce((s, p) => s + p.total, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#1E3A5F]">
          <p className="text-xs text-gray-500 mb-1">Conectados</p>
          <p className="text-2xl font-bold text-[#1E3A5F]">{totalConectados}/{marketplaces.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#D69E2E]">
          <p className="text-xs text-gray-500 mb-1">Produtos Online</p>
          <p className="text-2xl font-bold text-[#D69E2E]">{produtosOnline.length}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 mb-1">Pedidos Online</p>
          <p className="text-2xl font-bold text-green-600">{totalPedidosMarketplace}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 mb-1">Vendas Online</p>
          <p className="text-xl font-bold text-blue-600">{totalVendasMarketplace.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-[#1E3A5F] to-[#2C5282] text-white border-0">
        <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#D69E2E]" />
            <div>
              <p className="font-semibold">Demonstração ao vivo</p>
              <p className="text-xs text-white/80">Simule um pedido chegando de um marketplace</p>
            </div>
          </div>
          <Button onClick={() => setModalSimular(true)} className="bg-[#D69E2E] hover:bg-[#BFA82A] text-[#1E3A5F]">
            <Zap className="w-4 h-4 mr-2" /> Simular Pedido
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketplaces.map(mk => (
          <Card key={mk.id} className={mk.conectado ? '' : 'opacity-80'}>
            <div className="h-2" style={{ backgroundColor: mk.cor }} />
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: mk.cor + '20' }}>
                    {mk.logo}
                  </div>
                  <div>
                    <CardTitle className="text-base text-[#1E3A5F]">{mk.nome}</CardTitle>
                    <p className="text-xs text-gray-500">Comissão: {mk.comissao}</p>
                  </div>
                </div>
                {mk.conectado ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    <XCircle className="w-3 h-3 mr-1" /> Inativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-600">{mk.descricao}</p>
              {mk.conectado && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Produtos</p>
                    <p className="font-bold text-[#1E3A5F]">{mk.totalProdutos || 0}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Pedidos</p>
                    <p className="font-bold text-[#1E3A5F]">{mk.totalPedidos || 0}</p>
                  </div>
                </div>
              )}
              {mk.conectado && mk.ultimaSincronizacao && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Última sync: {formatData(mk.ultimaSincronizacao)}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                {mk.conectado ? (
                  <>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => sincronizar(mk)} disabled={sincronizando === mk.id}>
                      <RefreshCw className={`w-3 h-3 mr-1 ${sincronizando === mk.id ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setModalConfig(mk.id)}>
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => desconectar(mk)} className="text-red-500 hover:bg-red-50">
                      <Unlink className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="flex-1 bg-[#1E3A5F] hover:bg-[#2C5282]" onClick={() => setModalConfig(mk.id)}>
                    <Link2 className="w-3 h-3 mr-1" /> Conectar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F] text-base">Pedidos Recebidos por Marketplace</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Marketplace</th>
                <th className="p-3 text-center">Qtd Pedidos</th>
                <th className="p-3 text-right">Total Vendido</th>
                <th className="p-3">Último Pedido</th>
              </tr>
            </thead>
            <tbody>
              {marketplaces.filter(m => m.conectado).map(mk => {
                const origem = mapIdToOrigem(mk.id)
                const list = pedidosPorOrigem(origem)
                const total = list.filter(p => p.status !== 'Cancelado').reduce((s, p) => s + p.total, 0)
                const ultimo = list[0]
                return (
                  <tr key={mk.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{mk.logo}</span>
                        <span className="font-medium">{mk.nome}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">{list.length}</td>
                    <td className="p-3 text-right font-semibold">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-3 text-gray-600">{ultimo ? `#${ultimo.numero} - ${ultimo.clienteNome}` : '—'}</td>
                  </tr>
                )
              })}
              {marketplaces.filter(m => m.conectado).length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-8">Nenhum marketplace conectado</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!modalConfig} onOpenChange={open => !open && setModalConfig(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              {mkSelecionado && (<><span className="text-2xl">{mkSelecionado.logo}</span>{mkSelecionado.nome}</>)}
            </DialogTitle>
          </DialogHeader>
          {mkSelecionado && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">{mkSelecionado.descricao}</div>
              {mkSelecionado.conectado ? (
                <>
                  <div className="space-y-2">
                    <Label>Seller ID</Label>
                    <Input value={mkSelecionado.sellerId || ''} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Access Token</Label>
                    <Input value={mkSelecionado.accessToken || ''} readOnly type="password" />
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    ✓ Marketplace conectado e ativo.
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Client ID / App ID</Label>
                    <Input placeholder="Cole o Client ID" />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <Input type="password" placeholder="Cole o Client Secret" />
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                    <p className="font-semibold mb-1">Como obter as credenciais:</p>
                    <p>1. Acesse o painel de desenvolvedor do {mkSelecionado.nome}</p>
                    <p>2. Crie um aplicativo</p>
                    <p>3. Copie Client ID e Client Secret</p>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalConfig(null)}>Fechar</Button>
            {mkSelecionado && !mkSelecionado.conectado && (
              <Button onClick={confirmarConexao} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
                <Link2 className="w-4 h-4 mr-2" /> Conectar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalSimular} onOpenChange={setModalSimular}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#D69E2E]" /> Simular Pedido de Marketplace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Marketplace de Origem</Label>
              <Select value={simOrigem} onValueChange={(v: any) => setSimOrigem(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {marketplaces.filter(m => m.conectado).map(m => (
                    <SelectItem key={m.id} value={mapIdToOrigem(m.id)}>{m.logo} {m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input value={simCliente} onChange={e => setSimCliente(e.target.value)} placeholder="Ex: João da Silva" />
            </div>
            <div className="space-y-2">
              <Label>Produto</Label>
              <Select value={simProduto} onValueChange={setSimProduto}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {produtosOnline.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.modelo} - {p.marca} ({p.medida})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={simQtd} onChange={e => setSimQtd(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalSimular(false)}>Cancelar</Button>
            <Button onClick={simularPedido} className="bg-[#D69E2E] hover:bg-[#BFA82A] text-[#1E3A5F]">
              <Zap className="w-4 h-4 mr-2" /> Receber Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function mapIdToOrigem(id: MarketplaceId): OrigemPedido {
  switch (id) {
    case 'mercadolivre': return 'Mercado Livre'
    case 'shopee': return 'Shopee'
    case 'amazon': return 'Amazon'
    case 'magalu': return 'Magalu'
    case 'americanas': return 'Americanas'
  }
}

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
