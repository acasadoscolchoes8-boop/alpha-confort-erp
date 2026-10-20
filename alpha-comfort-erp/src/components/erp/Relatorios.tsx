'use client'

import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, Package, Users, DollarSign, ShoppingCart, Trophy, Download } from 'lucide-react'
import { formatMoeda } from '@/lib/utils-format'
import { toast } from 'sonner'

const CORES_GRAFICO = ['#1E3A5F', '#D69E2E', '#3182CE', '#38A169', '#E53E3E', '#805AD5', '#ED8936', '#38B2AC']

export function Relatorios() {
  const { pedidos, produtos, usuarios } = useStore()
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter(p => {
      if (p.status === 'Cancelado') return false
      const data = p.data.slice(0, 10)
      if (dataInicio && data < dataInicio) return false
      if (dataFim && data > dataFim) return false
      return true
    })
  }, [pedidos, dataInicio, dataFim])

  const relatorioVendedor = useMemo(() => {
    const map = new Map<string, { vendedorId: string; vendedorNome: string; qtdPedidos: number; totalVendas: number; totalLucro: number; ticketMedio: number }>()
    for (const p of pedidosFiltrados) {
      const atual = map.get(p.vendedorId) || { vendedorId: p.vendedorId, vendedorNome: p.vendedorNome, qtdPedidos: 0, totalVendas: 0, totalLucro: 0, ticketMedio: 0 }
      atual.qtdPedidos += 1
      atual.totalVendas += p.total
      const lucroPedido = p.itens.reduce((s, i) => {
        const prod = produtos.find(pr => pr.id === i.produtoId)
        return s + (i.subtotal - (prod ? prod.valorCompra * i.quantidade : 0))
      }, 0)
      atual.totalLucro += lucroPedido
      map.set(p.vendedorId, atual)
    }
    const arr = Array.from(map.values())
    arr.forEach(v => v.ticketMedio = v.qtdPedidos > 0 ? v.totalVendas / v.qtdPedidos : 0)
    return arr.sort((a, b) => b.totalVendas - a.totalVendas)
  }, [pedidosFiltrados, produtos])

  const relatorioProduto = useMemo(() => {
    const map = new Map<string, { produtoId: string; modelo: string; marca: string; medida: string; qtdVendida: number; totalVendas: number; totalLucro: number; qtdPedidos: number }>()
    for (const p of pedidosFiltrados) {
      for (const item of p.itens) {
        const atual = map.get(item.produtoId) || { produtoId: item.produtoId, modelo: item.modelo, marca: item.marca, medida: item.medida, qtdVendida: 0, totalVendas: 0, totalLucro: 0, qtdPedidos: 0 }
        atual.qtdVendida += item.quantidade
        atual.totalVendas += item.subtotal
        const prod = produtos.find(pr => pr.id === item.produtoId)
        const custo = prod ? prod.valorCompra * item.quantidade : 0
        atual.totalLucro += item.subtotal - custo
        atual.qtdPedidos += 1
        map.set(item.produtoId, atual)
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qtdVendida - a.qtdVendida)
  }, [pedidosFiltrados, produtos])

  const totalGeral = pedidosFiltrados.reduce((s, p) => s + p.total, 0)
  const qtdPedidos = pedidosFiltrados.length
  const ticketMedioGeral = qtdPedidos > 0 ? totalGeral / qtdPedidos : 0

  const dadosGraficoVendedor = relatorioVendedor.map(v => ({ name: v.vendedorNome, value: v.totalVendas }))
  const top5Produtos = relatorioProduto.slice(0, 5).map(p => ({
    name: p.modelo.length > 20 ? p.modelo.slice(0, 20) + '...' : p.modelo,
    qtd: p.qtdVendida,
  }))

  const limparFiltro = () => {
    setDataInicio('')
    setDataFim('')
    toast.success('Filtro limpo')
  }

  const exportarCSV = (tipo: 'vendedor' | 'produto') => {
    let linhas: string[] = []
    let nomeArquivo = ''
    if (tipo === 'vendedor') {
      nomeArquivo = 'relatorio-vendedores.csv'
      linhas.push('Vendedor;Qtd Pedidos;Total Vendas;Lucro;Ticket Medio')
      for (const v of relatorioVendedor) {
        linhas.push(`${v.vendedorNome};${v.qtdPedidos};${v.totalVendas.toFixed(2)};${v.totalLucro.toFixed(2)};${v.ticketMedio.toFixed(2)}`)
      }
    } else {
      nomeArquivo = 'relatorio-produtos.csv'
      linhas.push('Modelo;Marca;Medida;Qtd Vendida;Qtd Pedidos;Total Vendas;Lucro')
      for (const p of relatorioProduto) {
        linhas.push(`${p.modelo};${p.marca};${p.medida};${p.qtdVendida};${p.qtdPedidos};${p.totalVendas.toFixed(2)};${p.totalLucro.toFixed(2)}`)
      }
    }
    const csv = '\uFEFF' + linhas.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nomeArquivo
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Relatório exportado: ${nomeArquivo}`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F] text-base">Filtro de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-44" />
            </div>
            <Button variant="outline" onClick={limparFiltro} size="sm">Limpar Filtro</Button>
            <div className="ml-auto text-sm text-gray-500">{qtdPedidos} pedido(s) no período</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#1E3A5F]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Faturamento</p>
            <p className="text-xl font-bold text-[#1E3A5F]">{formatMoeda(totalGeral)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#D69E2E]">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Qtd Pedidos</p>
            <p className="text-xl font-bold text-[#D69E2E]">{qtdPedidos}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Ticket Médio</p>
            <p className="text-xl font-bold text-blue-600">{formatMoeda(ticketMedioGeral)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-1">Lucro Total</p>
            <p className="text-xl font-bold text-green-600">{formatMoeda(relatorioVendedor.reduce((s, v) => s + v.totalLucro, 0))}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vendedor">
        <TabsList>
          <TabsTrigger value="vendedor">📊 Por Vendedor</TabsTrigger>
          <TabsTrigger value="produto">📦 Por Produto</TabsTrigger>
        </TabsList>

        <TabsContent value="vendedor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#1E3A5F] text-base">Vendas por Vendedor</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportarCSV('vendedor')} disabled={relatorioVendedor.length === 0}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-center">Pedidos</TableHead>
                      <TableHead className="text-right">Total Vendas</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                      <TableHead className="text-right">Ticket Médio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioVendedor.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Nenhuma venda no período</TableCell></TableRow>
                    ) : (
                      relatorioVendedor.map((v, idx) => (
                        <TableRow key={v.vendedorId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {idx === 0 && <Trophy className="w-4 h-4 text-[#D69E2E]" />}
                              <span className="font-medium">{v.vendedorNome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{v.qtdPedidos}</TableCell>
                          <TableCell className="text-right font-medium text-[#1E3A5F]">{formatMoeda(v.totalVendas)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{formatMoeda(v.totalLucro)}</TableCell>
                          <TableCell className="text-right text-gray-600">{formatMoeda(v.ticketMedio)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#1E3A5F] text-base">Participação nas Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                {dadosGraficoVendedor.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-sm">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={dadosGraficoVendedor} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={(entry: any) => `${((entry.value / totalGeral) * 100).toFixed(0)}%`}>
                        {dadosGraficoVendedor.map((_, i) => <Cell key={i} fill={CORES_GRAFICO[i % CORES_GRAFICO.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatMoeda(v)} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produto" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-[#1E3A5F] text-base">Vendas por Produto</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportarCSV('produto')} disabled={relatorioProduto.length === 0}>
                  <Download className="w-4 h-4 mr-1" /> CSV
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd Vendida</TableHead>
                      <TableHead className="text-center">Pedidos</TableHead>
                      <TableHead className="text-right">Total Vendas</TableHead>
                      <TableHead className="text-right">Lucro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioProduto.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-8">Nenhuma venda no período</TableCell></TableRow>
                    ) : (
                      relatorioProduto.map((p, idx) => (
                        <TableRow key={p.produtoId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {idx < 3 && <Trophy className="w-4 h-4 text-[#D69E2E]" />}
                              <div>
                                <p className="font-medium">{p.modelo}</p>
                                <p className="text-xs text-gray-500">{p.marca} - {p.medida}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-bold">{p.qtdVendida}</TableCell>
                          <TableCell className="text-center text-gray-600">{p.qtdPedidos}</TableCell>
                          <TableCell className="text-right font-medium text-[#1E3A5F]">{formatMoeda(p.totalVendas)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">{formatMoeda(p.totalLucro)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#1E3A5F] text-base">Top 5 Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                {top5Produtos.length === 0 ? (
                  <p className="text-center text-gray-500 py-12 text-sm">Sem dados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={top5Produtos} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" stroke="#888" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#888" fontSize={10} width={90} />
                      <Tooltip formatter={(v: number) => `${v} un`} />
                      <Bar dataKey="qtd" fill="#1E3A5F" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
