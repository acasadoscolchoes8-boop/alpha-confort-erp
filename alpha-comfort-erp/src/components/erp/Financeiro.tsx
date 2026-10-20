'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle, Clock, Trash2, Pencil, Wallet, CreditCard, Percent, Trophy, Users } from 'lucide-react'
import { formatMoeda, formatDataCurta, calcularTaxaCartao } from '@/lib/utils-format'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const STATUS_CORES: Record<string, string> = {
  'pendente': 'bg-yellow-100 text-yellow-700',
  'pago': 'bg-green-100 text-green-700',
  'atrasado': 'bg-red-100 text-red-700',
  'cancelado': 'bg-gray-100 text-gray-600',
}

const CATEGORIAS = [
  { id: 'aluguel', label: 'Aluguel', icon: '🏠' },
  { id: 'salarios', label: 'Salários', icon: '👥' },
  { id: 'impostos', label: 'Impostos', icon: '📋' },
  { id: 'fornecedores', label: 'Fornecedores', icon: '📦' },
  { id: 'energia', label: 'Energia', icon: '⚡' },
  { id: 'internet', label: 'Internet', icon: '🌐' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'comissoes', label: 'Comissões', icon: '💰' },
  { id: 'outros', label: 'Outros', icon: '📝' },
] as const

const vazio = {
  tipo: 'pagar' as const,
  descricao: '',
  categoria: 'outros' as typeof CATEGORIAS[number]['id'],
  valor: 0,
  vencimento: new Date().toISOString().slice(0, 10),
  status: 'pendente' as const,
  observacoes: '',
  formaPagamento: 'PIX' as const,
}

export function Financeiro() {
  const { contas, pedidos, produtos, taxasBandeiras, configFinanceira, addConta, updateConta, removeConta, updateTaxaBandeira, updateConfigFinanceira } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vazio)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [modalTaxasOpen, setModalTaxasOpen] = useState(false)
  const [taxasEdit, setTaxasEdit] = useState(taxasBandeiras)
  const [comissaoEdit, setComissaoEdit] = useState(configFinanceira.comissaoVendedorPercent)
  const [modalComissaoOpen, setModalComissaoOpen] = useState(false)

  const contasPagar = contas.filter(c => c.tipo === 'pagar')
  const contasReceber = contas.filter(c => c.tipo === 'receber')
  const totalPagar = contasPagar.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((s, c) => s + c.valor, 0)
  const totalReceber = contasReceber.filter(c => c.status !== 'pago' && c.status !== 'cancelado').reduce((s, c) => s + c.valor, 0)
  const contasAtrasadas = contas.filter(c => c.status === 'atrasado').length
  const saldoAtual = totalReceber - totalPagar

  // Análise de vendas
  const analiseVendas = useMemo(() => {
    let faturamentoBruto = 0, totalTaxasCartao = 0, totalCustoProdutos = 0, lucroLiquido = 0, totalComissao = 0, lucroDono = 0
    const vendasDetalhadas: any[] = []
    const pctComissao = configFinanceira.comissaoVendedorPercent

    for (const p of pedidos) {
      if (p.status === 'Cancelado') continue
      const custo = p.itens.reduce((s, i) => {
        const prod = produtos.find(pr => pr.id === i.produtoId)
        return s + (prod ? prod.valorCompra * i.quantidade : 0)
      }, 0)
      const resultadoTaxa = calcularTaxaCartao(p.formaPagamento, p.bandeiraCartao, p.parcelas, p.total, taxasBandeiras)
      const isMarketplace = p.vendedorNome === 'Sistema (Marketplace)'
      const comissaoPedido = isMarketplace ? 0 : (resultadoTaxa.valorLiquido * pctComissao) / 100
      const lucroPedido = resultadoTaxa.valorLiquido - custo
      const lucroDonoPedido = lucroPedido - comissaoPedido

      faturamentoBruto += p.total
      totalTaxasCartao += resultadoTaxa.valorTaxa
      totalCustoProdutos += custo
      lucroLiquido += lucroPedido
      totalComissao += comissaoPedido
      lucroDono += lucroDonoPedido

      vendasDetalhadas.push({
        pedido: p, custo, taxaCartao: resultadoTaxa.valorTaxa, valorLiquido: resultadoTaxa.valorLiquido,
        comissao: comissaoPedido, lucroLiquido: lucroPedido, lucroDono: lucroDonoPedido,
      })
    }

    return {
      faturamentoBruto, totalTaxasCartao, totalCustoProdutos, lucroLiquido, totalComissao, lucroDono,
      margemLucro: faturamentoBruto > 0 ? (lucroDono / faturamentoBruto) * 100 : 0,
      vendasDetalhadas: vendasDetalhadas.sort((a, b) => b.pedido.data.localeCompare(a.pedido.data)),
    }
  }, [pedidos, produtos, taxasBandeiras, configFinanceira])

  const comissoesPorVendedor = useMemo(() => {
    const map = new Map<string, { vendedor: string; qtdPedidos: number; valorLiquido: number; comissao: number }>()
    const pctComissao = configFinanceira.comissaoVendedorPercent
    for (const p of pedidos) {
      if (p.status === 'Cancelado') continue
      if (p.vendedorNome === 'Sistema (Marketplace)') continue
      const resultadoTaxa = calcularTaxaCartao(p.formaPagamento, p.bandeiraCartao, p.parcelas, p.total, taxasBandeiras)
      const comissao = (resultadoTaxa.valorLiquido * pctComissao) / 100
      const atual = map.get(p.vendedorId) || { vendedor: p.vendedorNome, qtdPedidos: 0, valorLiquido: 0, comissao: 0 }
      atual.qtdPedidos += 1
      atual.valorLiquido += resultadoTaxa.valorLiquido
      atual.comissao += comissao
      map.set(p.vendedorId, atual)
    }
    return Array.from(map.values()).sort((a, b) => b.comissao - a.comissao)
  }, [pedidos, taxasBandeiras, configFinanceira])

  const analiseFormaPagamento = useMemo(() => {
    const map = new Map<string, { forma: string; qtd: number; total: number; taxas: number; liquido: number }>()
    for (const p of pedidos) {
      if (p.status === 'Cancelado') continue
      const chave = p.formaPagamento === 'CARTAO' && p.bandeiraCartao ? `CARTAO ${p.bandeiraCartao}` : p.formaPagamento
      const atual = map.get(chave) || { forma: chave, qtd: 0, total: 0, taxas: 0, liquido: 0 }
      atual.qtd += 1
      atual.total += p.total
      const taxa = calcularTaxaCartao(p.formaPagamento, p.bandeiraCartao, p.parcelas, p.total, taxasBandeiras)
      atual.taxas += taxa.valorTaxa
      atual.liquido += taxa.valorLiquido
      map.set(chave, atual)
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [pedidos, taxasBandeiras])

  const abrirNovo = (tipo: 'pagar' | 'receber') => {
    setForm({ ...vazio, tipo })
    setEditId(null)
    setModalOpen(true)
  }

  const abrirEditar = (c: any) => {
    setForm({ ...c })
    setEditId(c.id)
    setModalOpen(true)
  }

  const salvar = () => {
    if (!form.descricao.trim()) { toast.error('Digite a descrição'); return }
    if (form.valor <= 0) { toast.error('Valor deve ser maior que zero'); return }
    if (editId) {
      updateConta(editId, form)
      toast.success('Conta atualizada!')
    } else {
      addConta(form)
      toast.success(form.tipo === 'pagar' ? 'Conta a pagar criada!' : 'Conta a receber criada!')
    }
    setModalOpen(false)
  }

  const marcarPago = (c: any) => {
    updateConta(c.id, { status: 'pago', dataPagamento: new Date().toISOString().slice(0, 10) })
    toast.success(c.tipo === 'pagar' ? 'Conta paga!' : 'Recebimento confirmado!')
  }

  const confirmarExclusao = () => {
    if (excluirId) {
      removeConta(excluirId)
      toast.success('Conta excluída')
      setExcluirId(null)
    }
  }

  const salvarTaxas = () => {
    taxasEdit.forEach(t => updateTaxaBandeira(t.bandeira, t))
    toast.success('Taxas atualizadas!')
    setModalTaxasOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`border-l-4 ${saldoAtual >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Saldo Projetado</p>
            <p className={`text-xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatMoeda(saldoAtual)}</p>
            <p className="text-xs text-gray-500 mt-0.5">A receber - A pagar</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">A Receber</p>
            <p className="text-xl font-bold text-blue-600">{formatMoeda(totalReceber)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">A Pagar</p>
            <p className="text-xl font-bold text-amber-600">{formatMoeda(totalPagar)}</p>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${contasAtrasadas > 0 ? 'border-l-red-500' : 'border-l-gray-400'}`}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Atrasadas</p>
            <p className={`text-xl font-bold ${contasAtrasadas > 0 ? 'text-red-600' : 'text-gray-500'}`}>{contasAtrasadas}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lucro">
        <TabsList>
          <TabsTrigger value="lucro">📊 Lucro Líquido</TabsTrigger>
          <TabsTrigger value="contas">💰 Contas</TabsTrigger>
          <TabsTrigger value="taxas">💳 Taxas Cartão</TabsTrigger>
        </TabsList>

        <TabsContent value="lucro" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-[#1E3A5F]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">Faturamento Bruto</p>
                <p className="text-xl font-bold text-[#1E3A5F]">{formatMoeda(analiseVendas.faturamentoBruto)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-400">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">(-) Custo dos Produtos</p>
                <p className="text-xl font-bold text-red-500">-{formatMoeda(analiseVendas.totalCustoProdutos)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">(-) Taxas de Cartão</p>
                <p className="text-xl font-bold text-amber-600">-{formatMoeda(analiseVendas.totalTaxasCartao)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">Lucro Líquido (s/ comissão)</p>
                <p className="text-xl font-bold text-blue-600">{formatMoeda(analiseVendas.lucroLiquido)}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4 flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 mb-1">(-) Comissão Vendedores ({configFinanceira.comissaoVendedorPercent}%)</p>
                  <p className="text-xl font-bold text-purple-600">-{formatMoeda(analiseVendas.totalComissao)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setComissaoEdit(configFinanceira.comissaoVendedorPercent); setModalComissaoOpen(true) }} className="text-purple-600 h-7">
                  <Pencil className="w-3 h-3" />
                </Button>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500 bg-green-50/30">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">💰 Lucro do Dono</p>
                <p className="text-xl font-bold text-green-600">{formatMoeda(analiseVendas.lucroDono)}</p>
                <p className="text-xs text-green-700 mt-0.5 font-medium">Margem: {analiseVendas.margemLucro.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#1E3A5F] text-base">Detalhamento por Venda</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Venda Bruta</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Taxa Cartão</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead className="text-right">Lucro Dono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analiseVendas.vendasDetalhadas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center text-gray-500 py-8">Nenhuma venda</TableCell>
                      </TableRow>
                    ) : (
                      analiseVendas.vendasDetalhadas.map((v: any) => (
                        <TableRow key={v.pedido.id}>
                          <TableCell className="font-medium">#{v.pedido.numero}</TableCell>
                          <TableCell>{v.pedido.clienteNome}</TableCell>
                          <TableCell className="text-xs">
                            {v.pedido.vendedorNome === 'Sistema (Marketplace)'
                              ? <span className="text-purple-600">🌐 Marketplace</span>
                              : v.pedido.vendedorNome}
                          </TableCell>
                          <TableCell className="text-xs">
                            {v.pedido.formaPagamento}
                            {v.pedido.formaPagamento === 'CARTAO' && v.pedido.bandeiraCartao && ` ${v.pedido.bandeiraCartao} ${v.pedido.parcelas}x`}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatMoeda(v.pedido.total)}</TableCell>
                          <TableCell className="text-right text-red-500">-{formatMoeda(v.custo)}</TableCell>
                          <TableCell className="text-right text-amber-600">-{formatMoeda(v.taxaCartao)}</TableCell>
                          <TableCell className="text-right text-blue-600">{formatMoeda(v.valorLiquido)}</TableCell>
                          <TableCell className="text-right text-purple-600">
                            {v.comissao > 0 ? `-${formatMoeda(v.comissao)}` : '—'}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">{formatMoeda(v.lucroDono)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {analiseVendas.vendasDetalhadas.length > 0 && (
                    <TableRow className="bg-gray-50 border-t-2 border-gray-200">
                      <TableCell colSpan={4} className="font-bold">TOTAIS</TableCell>
                      <TableCell className="text-right font-bold text-[#1E3A5F]">{formatMoeda(analiseVendas.faturamentoBruto)}</TableCell>
                      <TableCell className="text-right font-bold text-red-500">-{formatMoeda(analiseVendas.totalCustoProdutos)}</TableCell>
                      <TableCell className="text-right font-bold text-amber-600">-{formatMoeda(analiseVendas.totalTaxasCartao)}</TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{formatMoeda(analiseVendas.faturamentoBruto - analiseVendas.totalTaxasCartao)}</TableCell>
                      <TableCell className="text-right font-bold text-purple-600">-{formatMoeda(analiseVendas.totalComissao)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600 text-base">{formatMoeda(analiseVendas.lucroDono)}</TableCell>
                    </TableRow>
                  )}
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#1E3A5F] text-base">Comissão por Vendedor ({configFinanceira.comissaoVendedorPercent}%)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => { setComissaoEdit(configFinanceira.comissaoVendedorPercent); setModalComissaoOpen(true) }}>
                <Pencil className="w-3 h-3 mr-1" /> Editar %
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-center">Pedidos</TableHead>
                    <TableHead className="text-right">Valor Líquido</TableHead>
                    <TableHead className="text-right">Comissão ({configFinanceira.comissaoVendedorPercent}%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comissoesPorVendedor.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-6">Nenhum vendedor com vendas</TableCell>
                    </TableRow>
                  ) : (
                    comissoesPorVendedor.map((v, idx) => (
                      <TableRow key={v.vendedor}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Trophy className="w-4 h-4 text-[#D69E2E]" />}
                            <span className="font-medium">{v.vendedor}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{v.qtdPedidos}</TableCell>
                        <TableCell className="text-right text-blue-600">{formatMoeda(v.valorLiquido)}</TableCell>
                        <TableCell className="text-right font-bold text-purple-600">{formatMoeda(v.comissao)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#1E3A5F] text-base">Análise por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Forma</TableHead>
                    <TableHead className="text-center">Qtd Vendas</TableHead>
                    <TableHead className="text-right">Total Bruto</TableHead>
                    <TableHead className="text-right">Taxas</TableHead>
                    <TableHead className="text-right">Líquido</TableHead>
                    <TableHead className="text-right">% Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analiseFormaPagamento.map(a => (
                    <TableRow key={a.forma}>
                      <TableCell className="font-medium">{a.forma}</TableCell>
                      <TableCell className="text-center">{a.qtd}</TableCell>
                      <TableCell className="text-right">{formatMoeda(a.total)}</TableCell>
                      <TableCell className="text-right text-amber-600">-{formatMoeda(a.taxas)}</TableCell>
                      <TableCell className="text-right text-blue-600 font-medium">{formatMoeda(a.liquido)}</TableCell>
                      <TableCell className="text-right text-gray-500">{a.total > 0 ? ((a.taxas / a.total) * 100).toFixed(2) : 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contas" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => abrirNovo('receber')} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
              <Plus className="w-4 h-4 mr-2" /> Nova Conta a Receber
            </Button>
            <Button onClick={() => abrirNovo('pagar')} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
              <Plus className="w-4 h-4 mr-2" /> Nova Conta a Pagar
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#1E3A5F] text-base">Contas a Receber</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasReceber.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-6">Nenhuma conta a receber</TableCell>
                    </TableRow>
                  ) : (
                    contasReceber.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium">{c.descricao}</p>
                          {c.observacoes && <p className="text-xs text-gray-500">{c.observacoes}</p>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {CATEGORIAS.find(cat => cat.id === c.categoria)?.icon} {CATEGORIAS.find(cat => cat.id === c.categoria)?.label}
                        </TableCell>
                        <TableCell className={c.status === 'atrasado' ? 'text-red-600 font-medium' : ''}>
                          {formatDataCurta(c.vencimento)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">{formatMoeda(c.valor)}</TableCell>
                        <TableCell><Badge className={STATUS_CORES[c.status]}>{c.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {c.status !== 'pago' && c.status !== 'cancelado' && (
                            <Button size="sm" variant="outline" onClick={() => marcarPago(c)} className="text-green-600 border-green-200 hover:bg-green-50 h-7">
                              <CheckCircle className="w-3 h-3 mr-1" /> Receber
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setExcluirId(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[#1E3A5F] text-base">Contas a Pagar</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPagar.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-6">Nenhuma conta a pagar</TableCell>
                    </TableRow>
                  ) : (
                    contasPagar.map(c => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium">{c.descricao}</p>
                          {c.observacoes && <p className="text-xs text-gray-500">{c.observacoes}</p>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {CATEGORIAS.find(cat => cat.id === c.categoria)?.icon} {CATEGORIAS.find(cat => cat.id === c.categoria)?.label}
                        </TableCell>
                        <TableCell className={c.status === 'atrasado' ? 'text-red-600 font-medium' : ''}>
                          {formatDataCurta(c.vencimento)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-500">{formatMoeda(c.valor)}</TableCell>
                        <TableCell><Badge className={STATUS_CORES[c.status]}>{c.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          {c.status !== 'pago' && c.status !== 'cancelado' && (
                            <Button size="sm" onClick={() => marcarPago(c)} className="bg-green-600 hover:bg-green-700 h-7">
                              <CheckCircle className="w-3 h-3 mr-1" /> Pagar
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setExcluirId(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#1E3A5F] text-base">Taxas de Cartão por Bandeira</CardTitle>
              <Button onClick={() => { setTaxasEdit(taxasBandeiras); setModalTaxasOpen(true) }} variant="outline" size="sm">
                <Pencil className="w-3 h-3 mr-1" /> Editar Taxas
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bandeira</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">1x (à vista)</TableHead>
                    <TableHead className="text-right">2 a 6x</TableHead>
                    <TableHead className="text-right">7 a 12x</TableHead>
                    <TableHead className="text-right">13 a 18x</TableHead>
                    <TableHead className="text-right">Processado</TableHead>
                    <TableHead className="text-right">Taxas Pagas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxasBandeiras.map(t => {
                    const vendasBandeira = pedidos.filter(p =>
                      p.status !== 'Cancelado' && p.formaPagamento === 'CARTAO' && p.bandeiraCartao === t.bandeira
                    )
                    const totalProcessado = vendasBandeira.reduce((s, p) => s + p.total, 0)
                    const totalTaxasBandeira = vendasBandeira.reduce((s, p) => {
                      const taxa = calcularTaxaCartao(p.formaPagamento, p.bandeiraCartao, p.parcelas, p.total, taxasBandeiras)
                      return s + taxa.valorTaxa
                    }, 0)
                    return (
                      <TableRow key={t.bandeira}>
                        <TableCell className="font-medium">{t.bandeira}</TableCell>
                        <TableCell className="text-right text-gray-600">{t.taxaDebito.toFixed(2)}%</TableCell>
                        <TableCell className="text-right text-blue-600">{t.taxaCredito1x.toFixed(2)}%</TableCell>
                        <TableCell className="text-right text-green-600">{t.taxaCredito2a6.toFixed(2)}%</TableCell>
                        <TableCell className="text-right text-amber-600">{t.taxaCredito7a12.toFixed(2)}%</TableCell>
                        <TableCell className="text-right text-red-600">{t.taxaCredito13a18.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">{formatMoeda(totalProcessado)}</TableCell>
                        <TableCell className="text-right text-red-500 font-medium">-{formatMoeda(totalTaxasBandeira)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="p-4 bg-blue-50 border-t border-blue-100 text-sm text-blue-800">
                💡 As taxas são aplicadas automaticamente no cálculo do lucro líquido. PIX e Dinheiro não pagam taxa.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">
              {editId ? 'Editar Conta' : form.tipo === 'pagar' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Aluguel do mês" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v: any) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pagar">A Pagar</SelectItem>
                    <SelectItem value="receber">A Receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v: any) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input type="date" value={form.vencimento} onChange={e => setForm({ ...form, vencimento: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={form.formaPagamento} onValueChange={(v: any) => setForm({ ...form, formaPagamento: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="CARTAO">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input value={form.observacoes || ''} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} className="bg-[#1E3A5F] hover:bg-[#2C5282]">{editId ? 'Salvar' : 'Cadastrar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalTaxasOpen} onOpenChange={setModalTaxasOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              <Percent className="w-5 h-5" /> Editar Taxas de Cartão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Configure as taxas cobradas pela sua maquininha para cada bandeira.</p>
            <div className="space-y-2">
              {taxasEdit.map((t, i) => (
                <div key={t.bandeira} className="grid grid-cols-6 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-6 sm:col-span-1">
                    <Label className="text-xs">Bandeira</Label>
                    <p className="font-medium text-sm">{t.bandeira}</p>
                  </div>
                  {[
                    { key: 'taxaDebito' as const, label: 'Débito %' },
                    { key: 'taxaCredito1x' as const, label: '1x %' },
                    { key: 'taxaCredito2a6' as const, label: '2 a 6x %' },
                    { key: 'taxaCredito7a12' as const, label: '7 a 12x %' },
                    { key: 'taxaCredito13a18' as const, label: '13 a 18x %' },
                  ].map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-xs">{field.label}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={t[field.key]}
                        onChange={e => {
                          const novo = [...taxasEdit]
                          novo[i] = { ...t, [field.key]: parseFloat(e.target.value) || 0 }
                          setTaxasEdit(novo)
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalTaxasOpen(false)}>Cancelar</Button>
            <Button onClick={salvarTaxas} className="bg-[#1E3A5F] hover:bg-[#2C5282]">Salvar Taxas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalComissaoOpen} onOpenChange={setModalComissaoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              <Users className="w-5 h-5" /> Comissão de Vendedor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
              A comissão é calculada sobre o <strong>valor líquido</strong> da venda (após descontar a taxa de cartão).
            </div>
            <div className="space-y-2">
              <Label>Percentual de Comissão (%) *</Label>
              <Input type="number" step="0.1" min="0" max="50" value={comissaoEdit} onChange={e => setComissaoEdit(parseFloat(e.target.value) || 0)} />
              <p className="text-xs text-gray-500">Ex: 5 = 5% do valor líquido. Padrão: 5%</p>
            </div>
            {(() => {
              const exemploVenda = 2000
              const exemploTaxa = 4.49
              const liquido = exemploVenda * (1 - exemploTaxa / 100)
              const comissao = (liquido * comissaoEdit) / 100
              return (
                <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <p className="font-semibold text-gray-700">💡 Exemplo (venda de R$ 2.000 no cartão 6x):</p>
                  <p>• Venda bruta: <strong>{formatMoeda(exemploVenda)}</strong></p>
                  <p>• Taxa cartão (4,49%): -{formatMoeda(exemploVenda * exemploTaxa / 100)}</p>
                  <p>• Valor líquido: <strong className="text-blue-600">{formatMoeda(liquido)}</strong></p>
                  <p>• Comissão ({comissaoEdit}%): <strong className="text-purple-600">{formatMoeda(comissao)}</strong></p>
                  <p>• Lucro do dono: <strong className="text-green-600">{formatMoeda(liquido - comissao)}</strong></p>
                </div>
              )
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalComissaoOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              updateConfigFinanceira({ comissaoVendedorPercent: comissaoEdit })
              toast.success(`Comissão atualizada para ${comissaoEdit}%`)
              setModalComissaoOpen(false)
            }} className="bg-[#1E3A5F] hover:bg-[#2C5282]">Salvar Comissão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirId} onOpenChange={open => !open && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao} className="bg-red-500 hover:bg-red-600">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
