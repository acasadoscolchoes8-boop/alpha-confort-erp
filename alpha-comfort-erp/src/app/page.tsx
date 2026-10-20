'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import { TelaLogin } from '@/components/erp/TelaLogin'
import { Layout, type Pagina } from '@/components/erp/Layout'
import { Dashboard } from '@/components/erp/Dashboard'
import { Clientes } from '@/components/erp/Clientes'
import { Produtos } from '@/components/erp/Produtos'
import { Estoque } from '@/components/erp/Estoque'
import { Pedidos } from '@/components/erp/Pedidos'
import { Entregas } from '@/components/erp/Entregas'
import { NotasFiscais } from '@/components/erp/NotasFiscais'
import { Relatorios } from '@/components/erp/Relatorios'
import { Marketplaces } from '@/components/erp/Marketplaces'
import { Financeiro } from '@/components/erp/Financeiro'
import { Usuarios } from '@/components/erp/Usuarios'
import { Configuracoes } from '@/components/erp/Configuracoes'

export default function Home() {
  const usuario = useStore(s => s.usuarioLogado)
  const [pagina, setPagina] = useState<Pagina>('dashboard')

  if (!usuario) {
    return (
      <>
        <TelaLogin />
        <Toaster />
      </>
    )
  }

  // Páginas que vendedor não pode acessar
  const paginasAdmin: Pagina[] = ['dashboard', 'clientes', 'produtos', 'notas', 'relatorios', 'marketplaces', 'financeiro', 'usuarios', 'config']

  if (usuario.role === 'vendedor' && paginasAdmin.includes(pagina)) {
    setPagina('pedidos')
    return null
  }

  return (
    <>
      <Layout pagina={pagina} setPagina={setPagina}>
        {pagina === 'dashboard' && usuario.role === 'admin' && <Dashboard />}
        {pagina === 'pedidos' && <Pedidos />}
        {pagina === 'clientes' && usuario.role === 'admin' && <Clientes />}
        {pagina === 'produtos' && usuario.role === 'admin' && <Produtos />}
        {pagina === 'estoque' && <Estoque />}
        {pagina === 'entregas' && <Entregas />}
        {pagina === 'notas' && usuario.role === 'admin' && <NotasFiscais />}
        {pagina === 'marketplaces' && usuario.role === 'admin' && <Marketplaces />}
        {pagina === 'financeiro' && usuario.role === 'admin' && <Financeiro />}
        {pagina === 'relatorios' && usuario.role === 'admin' && <Relatorios />}
        {pagina === 'usuarios' && usuario.role === 'admin' && <Usuarios />}
        {pagina === 'config' && usuario.role === 'admin' && <Configuracoes />}
      </Layout>
      <Toaster />
    </>
  )
}
