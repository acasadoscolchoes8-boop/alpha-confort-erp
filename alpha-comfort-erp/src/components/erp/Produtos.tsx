'use client'

import { useState } from 'react'
import { useStore, type Produto } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Pencil, Trash2, PackagePlus, TrendingUp } from 'lucide-react'
import { formatMoeda } from '@/lib/utils-format'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const vazio: Omit<Produto, 'id'> = {
  modelo: '', marca: '', medida: '',
  valorCompra: 0, valorVenda: 0,
  estoqueAtual: 0, estoqueMinimo: 5, ativo: true,
}

export function Produtos() {
  const { produtos, addProduto, updateProduto, removeProduto } = useStore()
  const [busca, setBusca] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vazio)
  const [excluirId, setExcluirId] = useState<string | null>(null)

  const marcas = Array.from(new Set(produtos.map(p => p.marca))).sort()

  const filtrados = produtos.filter(p => {
    const matchBusca = p.modelo.toLowerCase().includes(busca.toLowerCase()) ||
                       p.marca.toLowerCase().includes(busca.toLowerCase())
    const matchMarca = filtroMarca === 'todas' || p.marca === filtroMarca
    return matchBusca && matchMarca
  })

  const abrirNovo = () => {
    setForm(vazio)
    setEditId(null)
    setModalOpen(true)
  }

  const abrirEditar = (p: Produto) => {
    setForm({ ...p })
    setEditId(p.id)
    setModalOpen(true)
  }

  const salvar = () => {
    if (!form.modelo.trim() || !form.marca.trim() || !form.medida.trim()) {
      toast.error('Preencha modelo, marca e medida')
      return
    }
    if (form.valorVenda <= 0) {
      toast.error('Valor de venda deve ser maior que zero')
      return
    }
    if (editId) {
      updateProduto(editId, form)
      toast.success('Produto atualizado!')
    } else {
      addProduto(form)
      toast.success('Produto cadastrado!')
    }
    setModalOpen(false)
  }

  const confirmarExclusao = () => {
    if (excluirId) {
      removeProduto(excluirId)
      toast.success('Produto excluído')
      setExcluirId(null)
    }
  }

  const totalEstoqueValor = produtos.reduce((s, p) => s + p.valorCompra * p.estoqueAtual, 0)
  const totalLucroPotencial = produtos.reduce((s, p) => s + (p.valorVenda - p.valorCompra) * p.estoqueAtual, 0)

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Produtos Cadastrados</p>
          <p className="text-2xl font-bold text-[#1E3A5F]">{produtos.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Valor em Estoque (custo)</p>
          <p className="text-2xl font-bold text-blue-600">{formatMoeda(totalEstoqueValor)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Lucro Potencial</p>
          <p className="text-2xl font-bold text-[#D69E2E]">{formatMoeda(totalLucroPotencial)}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por modelo ou marca..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroMarca} onValueChange={setFiltroMarca}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas marcas</SelectItem>
              {marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={abrirNovo} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
          <PackagePlus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Medida</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Venda</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map(p => {
                  const lucro = p.valorVenda - p.valorCompra
                  const estoqueBaixo = p.estoqueAtual <= p.estoqueMinimo
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.modelo}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.marca}</span>
                      </TableCell>
                      <TableCell className="text-gray-600">{p.medida}</TableCell>
                      <TableCell className="text-right text-gray-600">{formatMoeda(p.valorCompra)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMoeda(p.valorVenda)}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatMoeda(lucro)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          estoqueBaixo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {p.estoqueAtual} {estoqueBaixo && '⚠'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => abrirEditar(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setExcluirId(p.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">
              {editId ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Modelo *</Label>
                <Input
                  value={form.modelo}
                  onChange={e => setForm({ ...form, modelo: e.target.value })}
                  placeholder="Ex: Premium Viscoelástico"
                />
              </div>
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Input
                  value={form.marca}
                  onChange={e => setForm({ ...form, marca: e.target.value })}
                  placeholder="Ex: Castor"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Medida *</Label>
              <Input
                value={form.medida}
                onChange={e => setForm({ ...form, medida: e.target.value })}
                placeholder="Ex: Casal 138x188cm"
              />
              <p className="text-xs text-gray-500">Formato livre. Ex: Solteiro 88x188, Queen 158x198</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor de Compra (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valorCompra}
                  onChange={e => setForm({ ...form, valorCompra: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor de Venda (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valorVenda}
                  onChange={e => setForm({ ...form, valorVenda: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {form.valorVenda > 0 && form.valorCompra > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Lucro por unidade: {formatMoeda(form.valorVenda - form.valorCompra)}
                  </p>
                  <p className="text-xs text-green-600">
                    Margem: {((form.valorVenda - form.valorCompra) / form.valorVenda * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque Atual</Label>
                <Input
                  type="number"
                  value={form.estoqueAtual}
                  onChange={e => setForm({ ...form, estoqueAtual: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo (alerta)</Label>
                <Input
                  type="number"
                  value={form.estoqueMinimo}
                  onChange={e => setForm({ ...form, estoqueMinimo: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
              {editId ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirId} onOpenChange={open => !open && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
