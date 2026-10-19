'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Boxes, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react'
import { formatMoeda } from '@/lib/utils-format'
import { toast } from 'sonner'

export function Estoque() {
  const { produtos, ajustarEstoque } = useStore()
  const [modalProdutoId, setModalProdutoId] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [quantidade, setQuantidade] = useState(1)
  const [motivo, setMotivo] = useState('')

  const produtoSelecionado = produtos.find(p => p.id === modalProdutoId)

  const totalValor = produtos.reduce((s, p) => s + p.valorCompra * p.estoqueAtual, 0)
  const totalUnidades = produtos.reduce((s, p) => s + p.estoqueAtual, 0)
  const baixoEstoque = produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo)

  const ajustar = () => {
    if (!produtoSelecionado) return
    if (quantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }
    const qtd = tipo === 'entrada' ? quantidade : -quantidade
    if (tipo === 'saida' && produtoSelecionado.estoqueAtual < quantidade) {
      toast.error('Estoque insuficiente')
      return
    }
    ajustarEstoque(produtoSelecionado.id, qtd, motivo)
    toast.success(`Estoque ${tipo === 'entrada' ? 'aumentado' : 'reduzido'} em ${quantidade} un`)
    setModalProdutoId(null)
    setQuantidade(1)
    setMotivo('')
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total de Unidades</p>
              <p className="text-2xl font-bold text-blue-600">{totalUnidades}</p>
            </div>
            <Boxes className="w-8 h-8 text-blue-300" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#1E3A5F]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valor em Estoque</p>
              <p className="text-2xl font-bold text-[#1E3A5F]">{formatMoeda(totalValor)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#1E3A5F]/30" />
          </div>
        </Card>
        <Card className={`p-4 border-l-4 ${baixoEstoque.length > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Alertas de Estoque</p>
              <p className={`text-2xl font-bold ${baixoEstoque.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {baixoEstoque.length}
              </p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${baixoEstoque.length > 0 ? 'text-red-300' : 'text-green-300'}`} />
          </div>
        </Card>
      </div>

      {baixoEstoque.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
              <AlertTriangle className="w-5 h-5" />
              Produtos com estoque baixo ({baixoEstoque.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {baixoEstoque.map(p => (
                <span key={p.id} className="px-3 py-1 bg-white border border-red-200 rounded-full text-xs">
                  {p.modelo} ({p.medida}) - <strong className="text-red-600">{p.estoqueAtual}</strong> un
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F]">Estoque por Produto</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Medida</TableHead>
                <TableHead className="text-center">Atual</TableHead>
                <TableHead className="text-center">Mínimo</TableHead>
                <TableHead className="text-right">Valor Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map(p => {
                const baixo = p.estoqueAtual <= p.estoqueMinimo
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.modelo}</TableCell>
                    <TableCell>{p.marca}</TableCell>
                    <TableCell className="text-gray-600">{p.medida}</TableCell>
                    <TableCell className="text-center font-bold">{p.estoqueAtual}</TableCell>
                    <TableCell className="text-center text-gray-500">{p.estoqueMinimo}</TableCell>
                    <TableCell className="text-right">{formatMoeda(p.estoqueAtual * p.valorCompra)}</TableCell>
                    <TableCell className="text-center">
                      {baixo ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Baixo</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">OK</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModalProdutoId(p.id)}
                      >
                        Ajustar
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Ajuste */}
      <Dialog open={!!modalProdutoId} onOpenChange={open => !open && setModalProdutoId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">Ajustar Estoque</DialogTitle>
          </DialogHeader>

          {produtoSelecionado && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{produtoSelecionado.modelo}</p>
                <p className="text-sm text-gray-500">{produtoSelecionado.marca} - {produtoSelecionado.medida}</p>
                <p className="text-sm mt-1">Estoque atual: <strong>{produtoSelecionado.estoqueAtual}</strong> un</p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <Select value={tipo} onValueChange={(v: 'entrada' | 'saida') => setTipo(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-green-600" /> Entrada
                      </span>
                    </SelectItem>
                    <SelectItem value="saida">
                      <span className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-red-600" /> Saída
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={e => setQuantidade(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo (opcional)</Label>
                <Input
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder={tipo === 'entrada' ? 'Ex: Compra de mercadoria' : 'Ex: Perda / Ajuste'}
                />
              </div>

              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                tipo === 'entrada' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {tipo === 'entrada' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <span className="text-sm">
                  Novo estoque: <strong>{produtoSelecionado.estoqueAtual + (tipo === 'entrada' ? quantidade : -quantidade)}</strong> un
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalProdutoId(null)}>Cancelar</Button>
            <Button
              onClick={ajustar}
              className={tipo === 'entrada' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
