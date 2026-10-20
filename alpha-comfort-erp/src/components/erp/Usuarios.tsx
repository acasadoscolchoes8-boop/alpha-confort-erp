'use client'

import { useState } from 'react'
import { useStore, type Usuario, type Role, type ModuloSistema, type Permissao, type PermissoesModulos, PERMISSOES_POR_ROLE } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Pencil, Trash2, Shield, User, Mail, KeyRound, Eye, EyeOff, Lock, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const MODULOS: { id: ModuloSistema; label: string; icon: string; descricao: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', descricao: 'Visão geral com gráficos' },
  { id: 'pedidos', label: 'Pedidos', icon: '🛒', descricao: 'Criar e gerenciar vendas' },
  { id: 'clientes', label: 'Clientes', icon: '👥', descricao: 'Cadastro de clientes' },
  { id: 'produtos', label: 'Produtos', icon: '🛏️', descricao: 'Catálogo de colchões' },
  { id: 'estoque', label: 'Estoque', icon: '📦', descricao: 'Controle de quantidade' },
  { id: 'entregas', label: 'Entregas', icon: '🚚', descricao: 'Agendamento e rota' },
  { id: 'notas', label: 'Notas Fiscais', icon: '🧾', descricao: 'Emissão de NF-e' },
  { id: 'marketplaces', label: 'Marketplaces', icon: '🌐', descricao: 'ML, Shopee, Amazon' },
  { id: 'financeiro', label: 'Financeiro', icon: '💰', descricao: 'Contas e lucro líquido' },
  { id: 'relatorios', label: 'Relatórios', icon: '📈', descricao: 'Vendas por vendedor/produto' },
  { id: 'config', label: 'Configurações', icon: '⚙️', descricao: 'Dados da empresa' },
]

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  vendedor: 'Vendedor (Padrão)',
  personalizado: 'Personalizado',
}

const PERMISSAO_LABELS: Record<Permissao, string> = {
  'editar': 'Editar',
  'visualizar': 'Visualizar',
  'nenhuma': 'Sem acesso',
}

const formVazio: Omit<Usuario, 'id'> = {
  nome: '', email: '', senha: '', role: 'vendedor', ativo: true,
  permissoes: { ...PERMISSOES_POR_ROLE.vendedor },
}

export function Usuarios() {
  const { usuarios, usuarioLogado, addUsuario, updateUsuario, removeUsuario } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<Usuario, 'id'>>(formVazio)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  const abrirNovo = () => {
    setForm({ ...formVazio, permissoes: { ...PERMISSOES_POR_ROLE.vendedor } })
    setEditId(null)
    setMostrarSenha(false)
    setModalOpen(true)
  }

  const abrirEditar = (u: Usuario) => {
    setForm({
      nome: u.nome, email: u.email, senha: u.senha, role: u.role, ativo: u.ativo,
      permissoes: u.permissoes ? { ...u.permissoes } : { ...PERMISSOES_POR_ROLE[u.role] },
    })
    setEditId(u.id)
    setMostrarSenha(false)
    setModalOpen(true)
  }

  const trocarRole = (role: Role) => {
    setForm({ ...form, role, permissoes: { ...PERMISSOES_POR_ROLE[role] } })
  }

  const trocarPermissao = (modulo: ModuloSistema, perm: Permissao) => {
    if (!form.permissoes) return
    setForm({ ...form, permissoes: { ...form.permissoes, [modulo]: perm } })
  }

  const salvar = () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim()) {
      toast.error('Preencha nome, email e senha'); return
    }
    if (form.senha.length < 4) { toast.error('Senha deve ter no mínimo 4 caracteres'); return }
    const emailExiste = usuarios.some(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editId)
    if (emailExiste) { toast.error('Já existe um usuário com este email'); return }
    if (editId) {
      updateUsuario(editId, form)
      toast.success('Usuário atualizado!')
    } else {
      addUsuario(form)
      toast.success('Usuário criado!')
    }
    setModalOpen(false)
  }

  const confirmarExclusao = () => {
    if (excluirId) {
      if (excluirId === usuarioLogado?.id) {
        toast.error('Você não pode excluir seu próprio usuário!')
        setExcluirId(null); return
      }
      removeUsuario(excluirId)
      toast.success('Usuário excluído')
      setExcluirId(null)
    }
  }

  const toggleAtivo = (u: Usuario) => {
    if (u.id === usuarioLogado?.id) { toast.error('Você não pode desativar seu próprio usuário'); return }
    updateUsuario(u.id, { ativo: !u.ativo })
    toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
  }

  const contarAcessos = (u: Usuario): number => {
    const perms = u.permissoes || PERMISSOES_POR_ROLE[u.role]
    return MODULOS.filter(m => perms[m.id] !== 'nenhuma').length
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">{usuarios.length} usuário(s) · {usuarios.filter(u => u.ativo).length} ativo(s)</div>
        <Button onClick={abrirNovo} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
          <UserPlus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F] text-base flex items-center gap-2">
            <Shield className="w-4 h-4" /> Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-center">Acessos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map(u => {
                const isSelf = u.id === usuarioLogado?.id
                const acessos = contarAcessos(u)
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${u.role === 'admin' ? 'bg-[#1E3A5F] text-white' : 'bg-[#D69E2E] text-[#1E3A5F]'}`}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            {u.nome}
                            {isSelf && <span className="text-xs text-gray-500">(você)</span>}
                          </p>
                          <p className="text-xs text-gray-500">
                            {u.role === 'admin' && '👑 Acesso total'}
                            {u.role === 'vendedor' && '🛒 Vendedor padrão'}
                            {u.role === 'personalizado' && '⚙️ Personalizado'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={u.role === 'admin' ? 'bg-[#1E3A5F] text-white hover:bg-[#1E3A5F]'
                        : u.role === 'vendedor' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-100'}>
                        {ROLE_LABELS[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">{acessos}/{MODULOS.length}</span>
                      <span className="text-xs text-gray-500 ml-1">módulos</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <button onClick={() => toggleAtivo(u)} disabled={isSelf}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${u.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'} ${isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        {u.ativo ? '✓ Ativo' : '✗ Inativo'}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => abrirEditar(u)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setExcluirId(u.id)} disabled={isSelf}>
                        <Trash2 className={`w-4 h-4 ${isSelf ? 'text-gray-300' : 'text-red-500'}`} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              <User className="w-5 h-5" /> {editId ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: João da Silva" className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="usuario@email.com" className="pl-9" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Senha *</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type={mostrarSenha ? 'text' : 'password'} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} placeholder="Mínimo 4 caracteres" className="pl-9 pr-9" />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Perfil de Acesso *</Label>
                <Select value={form.role} onValueChange={(v: Role) => trocarRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">👑 Administrador - Acesso total</SelectItem>
                    <SelectItem value="vendedor">🛒 Vendedor - Padrão</SelectItem>
                    <SelectItem value="personalizado">⚙️ Personalizado - Definir permissões</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className={`space-y-3 ${form.role !== 'personalizado' ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Permissões por Módulo</p>
                    <p className="text-xs text-blue-700">
                      {form.role === 'personalizado' ? 'Configure o acesso de cada módulo' : `Definido pelo perfil "${ROLE_LABELS[form.role]}". Mude para Personalizado para editar.`}
                    </p>
                  </div>
                </div>
                {form.role === 'personalizado' && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => {
                      const todas: PermissoesModulos = { ...form.permissoes! }
                      MODULOS.forEach(m => { todas[m.id] = 'editar' })
                      setForm({ ...form, permissoes: todas })
                    }} className="text-xs h-7">Marcar tudo</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const todas: PermissoesModulos = { ...form.permissoes! }
                      MODULOS.forEach(m => { todas[m.id] = 'nenhuma' })
                      setForm({ ...form, permissoes: todas })
                    }} className="text-xs h-7">Limpar tudo</Button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {MODULOS.map(m => {
                  const perm = form.permissoes?.[m.id] || 'nenhuma'
                  return (
                    <div key={m.id} className={`p-3 border rounded-lg ${perm === 'nenhuma' ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{m.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{m.label}</p>
                            <p className="text-xs text-gray-500 truncate">{m.descricao}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(['nenhuma', 'visualizar', 'editar'] as Permissao[]).map(p => (
                          <button key={p} type="button" disabled={form.role !== 'personalizado'} onClick={() => trocarPermissao(m.id, p)}
                            className={`flex-1 py-1 px-2 rounded text-xs font-medium transition ${perm === p
                              ? p === 'editar' ? 'bg-green-500 text-white'
                              : p === 'visualizar' ? 'bg-blue-500 text-white'
                              : 'bg-gray-300 text-gray-700'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} ${form.role !== 'personalizado' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            {p === 'editar' && <Check className="w-3 h-3 inline mr-1" />}
                            {p === 'nenhuma' && <X className="w-3 h-3 inline mr-1" />}
                            {PERMISSAO_LABELS[p]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <button type="button" onClick={() => setForm({ ...form, ativo: !form.ativo })}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${form.ativo ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {form.ativo && <Check className="w-3 h-3 text-white" />}
              </button>
              <div>
                <p className="text-sm font-medium">Usuário ativo</p>
                <p className="text-xs text-gray-500">Apenas usuários ativos podem fazer login</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={salvar} className="bg-[#1E3A5F] hover:bg-[#2C5282]">{editId ? 'Salvar Alterações' : 'Criar Usuário'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirId} onOpenChange={open => !open && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>O usuário será removido permanentemente.</AlertDialogDescription>
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
