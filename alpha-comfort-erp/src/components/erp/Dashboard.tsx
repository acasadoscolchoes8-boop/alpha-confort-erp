'use client'

import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMoeda, formatDataCurta } from '@/lib/utils-format'
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, TrendingUp } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

export function Dashboard() {
  const pedidos = useStore(s => s.pedidos)
  const clientes = useStore(s => s.clientes)
  const produtos = useStore(s => s.produtos)

  // Vendas do mês
  const agora = new Date()
  const vendasMes = pedidos
    .filter(p => p.status !== 'Cancelado')
    .filter(p => {
      const d = new Date(p.data)
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
    })
    .reduce((sum, p) => sum + p.total, 0)

  const totalClientes = clientes.length
  const estoqueBaixo = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo)
  const totalItensEstoque = produtos.reduce((sum, p) => sum + p.estoqueAtual, 0)

  // Gráfico - últimos 7 dias
  const dadosGrafico = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dataStr = d.toISOString().slice(0, 10)
    const total = pedidos
      .filter(p => p.data.slice(0, 10) === dataStr && p.status !== 'Cancelado')
      .reduce((s, p) => s + p.total, 0)
    return {
      dia: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      vendas: total,
    }
  })

  const lucroTotal = pedidos
    .filter(p => p.status !== 'Cancelado')
    .reduce((sum, p) => sum + p.itens.reduce((s, i) => {
      const prod = produtos.find(pr => pr.id === i.produtoId)
      return s + (i.subtotal - (prod ? prod.valorCompra * i.quantidade : 0))
    }, 0), 0)

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#1E3A5F]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Vendas do Mês</CardTitle>
            <DollarSign className="w-5 h-5 text-[#1E3A5F]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1E3A5F]">{formatMoeda(vendasMes)}</div>
            <p className="text-xs text-gray-500 mt-1">{pedidos.filter(p => p.status !== 'Cancelado').length} pedidos total</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#D69E2E]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lucro do Mês</CardTitle>
            <TrendingUp className="w-5 h-5 text-[#D69E2E]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#D69E2E]">{formatMoeda(lucroTotal)}</div>
            <p className="text-xs text-gray-500 mt-1">margem de lucro</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estoque Total</CardTitle>
            <Package className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalItensEstoque} un</div>
            <p className="text-xs text-gray-500 mt-1">{produtos.length} produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Clientes</CardTitle>
            <Users className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalClientes}</div>
            <p className="text-xs text-gray-500 mt-1">cadastrados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de vendas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1E3A5F]">Vendas dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dadosGrafico}>
                <defs>
                  <linearGradient id="colorVenda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="dia" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => formatMoeda(v)} />
                <Area type="monotone" dataKey="vendas" stroke="#1E3A5F" strokeWidth={2} fill="url(#colorVenda)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estoque baixo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#1E3A5F]">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Estoque Baixo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {estoqueBaixo.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">Tudo certo! Sem alertas.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {estoqueBaixo.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.modelo}</p>
                      <p className="text-xs text-gray-500">{p.medida}</p>
                    </div>
                    <span className="text-sm font-bold text-red-600 ml-2">{p.estoqueAtual}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pedidos recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F]">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4">Nº</th>
                  <th className="pb-2 pr-4">Cliente</th>
                  <th className="pb-2 pr-4">Data</th>
                  <th className="pb-2 pr-4">Pagamento</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.slice(0, 5).map(p => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">#{p.numero}</td>
                    <td className="py-3 pr-4">{p.clienteNome}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatDataCurta(p.data)}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.formaPagamento}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">{p.status}</span>
                    </td>
                    <td className="py-3 text-right font-semibold">{formatMoeda(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
