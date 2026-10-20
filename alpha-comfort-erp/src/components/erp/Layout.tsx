'use client'

import { useStore } from '@/lib/store'
import { BedDouble, LayoutDashboard, Users, Package, Boxes, ShoppingCart, Truck, FileText, LogOut, User, BarChart3, Globe, DollarSign, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Notificacoes } from './Notificacoes'

export type Pagina =
  | 'dashboard'
  | 'pedidos'
  | 'clientes'
  | 'produtos'
  | 'estoque'
  | 'entregas'
  | 'notas'
  | 'relatorios'
  | 'marketplaces'
  | 'financeiro'
  | 'usuarios'
  | 'config'

interface MenuItem {
  id: Pagina
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const menuItens: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
  { id: 'clientes', label: 'Clientes', icon: Users, adminOnly: true },
  { id: 'produtos', label: 'Produtos', icon: Package, adminOnly: true },
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'entregas', label: 'Entregas', icon: Truck },
  { id: 'notas', label: 'Notas Fiscais', icon: FileText, adminOnly: true },
  { id: 'marketplaces', label: 'Marketplaces', icon: Globe, adminOnly: true },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, adminOnly: true },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  { id: 'usuarios', label: 'Usuários', icon: Shield, adminOnly: true },
  { id: 'config', label: 'Configurações', icon: User, adminOnly: true },
]

interface LayoutProps {
  pagina: Pagina
  setPagina: (p: Pagina) => void
  children: React.ReactNode
}

export function Layout({ pagina, setPagina, children }: LayoutProps) {
  const usuario = useStore(s => s.usuarioLogado)
  const logout = useStore(s => s.logout)
  const dadosEmpresa = useStore(s => s.dadosEmpresa)

  if (!usuario) return null

  const itensVisiveis = menuItens.filter(i => !i.adminOnly || usuario.role === 'admin')

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col fixed h-screen">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {dadosEmpresa?.logo ? (
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 p-1">
                <img src={dadosEmpresa.logo} alt={dadosEmpresa.nomeEmpresa} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-[#D69E2E] rounded-lg flex items-center justify-center flex-shrink-0">
                <BedDouble className="w-6 h-6 text-[#1E3A5F]" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-sm">{dadosEmpresa?.nomeEmpresa || 'Alpha Comfort'}</h1>
              <p className="text-xs text-white/60">ERP Colchões</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {itensVisiveis.map(item => {
            const Icon = item.icon
            const ativo = pagina === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPagina(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors',
                  ativo
                    ? 'bg-white/10 text-white border-r-4 border-[#D69E2E]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#D69E2E] rounded-full flex items-center justify-center text-[#1E3A5F] font-bold text-sm">
              {usuario.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{usuario.nome}</p>
              <p className="text-xs text-white/60 capitalize">{usuario.role}</p>
            </div>
          </div>
          <Button
            onClick={() => {
              logout()
              toast.success('Sessão encerrada')
            }}
            variant="outline"
            size="sm"
            className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-[#1E3A5F] capitalize">
            {menuItens.find(i => i.id === pagina)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {usuario.role === 'admin' && (
              <Notificacoes onNavigate={(p) => setPagina(p as Pagina)} />
            )}
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
