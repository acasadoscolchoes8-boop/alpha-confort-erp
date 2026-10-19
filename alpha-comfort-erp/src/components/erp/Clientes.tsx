'use client'

import { useState } from 'react'
import { useStore, type Cliente } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Pencil, Trash2, UserPlus, Loader2 } from 'lucide-react'
import { maskCPF, maskTelefone, maskCEP, buscarCep, formatDataCurta } from '@/lib/utils-format'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const vazio: Omit<Cliente, 'id' | 'createdAt'> = {
  nome: '', cpf: '', telefone: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', complemento: ''
}

export function Clientes() {
  const { clientes, addCliente, updateCliente, removeCliente } = useStore()
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(vazio)
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [excluirId, setExcluirId] = useState<string | null>(null)

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cpf.includes(busca)
  )

  const abrirNovo = () => {
    setForm(vazio)
    setEditId(null)
    setModalOpen(true)
  }

  const abrirEditar = (c: Cliente) => {
    setForm({ ...c })
    setEditId(c.id)
    setModalOpen(true)
  }

  const handleCep = async () => {
    if (form.cep.replace(/\D/g, '').length !== 8) return
    setBuscandoCep(true)
    const end = await buscarCep(form.cep)
    if (end) {
      setForm(f => ({
        ...f,
        rua: end.logradouro,
        bairro: end.bairro,
        cidade: end.localidade,
        estado: end.uf,
        complemento: end.complemento || f.complemento,
      }))
      toast.success('Endereço preenchido automaticamente!')
    } else {
      toast.error('CEP não encontrado. Preencha manualmente.')
    }
    setBuscandoCep(false)
  }

  const salvar = () => {
    if (!form.nome.trim() || !form.cpf.trim()) {
      toast.error('Preencha pelo menos nome e CPF')
      return
    }
    if (editId) {
      updateCliente(editId, form)
      toast.success('Cliente atualizado!')
    } else {
      addCliente(form)
      toast.success('Cliente cadastrado!')
    }
    setModalOpen(false)
  }

  const confirmarExclusao = () => {
    if (excluirId) {
      removeCliente(excluirId)
      toast.success('Cliente excluído')
      setExcluirId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={abrirNovo} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.cpf}</TableCell>
                    <TableCell>{c.telefone}</TableCell>
                    <TableCell>{c.cidade}/{c.estado}</TableCell>
                    <TableCell className="text-gray-500">{formatDataCurta(c.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(c)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setExcluirId(c.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Form */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">
              {editId ? 'Editar Cliente' : 'Novo Cliente'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Nome completo *</Label>
                <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CPF *</Label>
                <Input
                  value={form.cpf}
                  onChange={e => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: maskTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.cep}
                    onChange={e => setForm({ ...form, cep: maskCEP(e.target.value) })}
                    onBlur={handleCep}
                    placeholder="00000-000"
                  />
                  <Button type="button" variant="outline" onClick={handleCep} disabled={buscandoCep}>
                    {buscandoCep ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Digite o CEP e clique em buscar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Rua</Label>
                <Input value={form.rua} onChange={e => setForm({ ...form, rua: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Input
                  value={form.estado}
                  onChange={e => setForm({ ...form, estado: e.target.value.toUpperCase().slice(0, 2) })}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} />
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
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente será removido permanentemente.
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
