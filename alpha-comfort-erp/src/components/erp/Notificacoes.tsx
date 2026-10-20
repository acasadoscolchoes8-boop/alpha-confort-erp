'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Bell, AlertTriangle, Truck, Calendar, DollarSign, X } from 'lucide-react'
import { formatMoeda, formatDataCurta } from '@/lib/utils-format'

interface NotificacoesProps {
  onNavigate: (pagina: 'financeiro' | 'entregas') => void
}

interface Notificacao {
  id: string
  tipo: 'conta_atrasada' | 'conta_hoje' | 'conta_amanha' | 'entrega_hoje' | 'entrega_amanha'
  titulo: string
  descricao: string
  valor?: number
  data?: string
  cor: string
  icon: React.ComponentType<{ className?: string }>
}

export function Notificacoes({ onNavigate }: NotificacoesProps) {
  const { contas, entregas } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const hoje = new Date().toISOString().slice(0, 10)
  const amanha = new Date()
  amanha.setDate(amanha.getDate() + 1)
  const amanhaStr = amanha.toISOString().slice(0, 10)

  const notificacoes: Notificacao[] = []

  contas.filter(c => c.tipo === 'pagar' && c.status === 'atrasado').forEach(c => {
    notificacoes.push({
      id: `atrasada_${c.id}`, tipo: 'conta_atrasada', titulo: '⚠️ Conta Atrasada!',
      descricao: c.descricao, valor: c.valor, data: c.vencimento, cor: 'red', icon: AlertTriangle,
    })
  })
  contas.filter(c => c.tipo === 'pagar' && c.status === 'pendente' && c.vencimento === hoje).forEach(c => {
    notificacoes.push({
      id: `hoje_${c.id}`, tipo: 'conta_hoje', titulo: '💸 Vence Hoje',
      descricao: c.descricao, valor: c.valor, cor: 'orange', icon: DollarSign,
    })
  })
  contas.filter(c => c.tipo === 'pagar' && c.status === 'pendente' && c.vencimento === amanhaStr).forEach(c => {
    notificacoes.push({
      id: `amanha_${c.id}`, tipo: 'conta_amanha', titulo: '📅 Vence Amanhã',
      descricao: c.descricao, valor: c.valor, cor: 'amber', icon: Calendar,
    })
  })
  entregas.filter(e => e.dataEntrega === hoje && e.status !== 'Entregue' && e.status !== 'Falha').forEach(e => {
    notificacoes.push({
      id: `entrega_hoje_${e.id}`, tipo: 'entrega_hoje', titulo: '🚚 Entrega Hoje',
      descricao: `${e.pedidoNumero > 0 ? `#${e.pedidoNumero}` : 'Avulsa'} - ${e.clienteNome} às ${e.horario}`,
      cor: 'blue', icon: Truck,
    })
  })
  entregas.filter(e => e.dataEntrega === amanhaStr && e.status !== 'Entregue' && e.status !== 'Falha').forEach(e => {
    notificacoes.push({
      id: `entrega_amanha_${e.id}`, tipo: 'entrega_amanha', titulo: '🚚 Entrega Amanhã',
      descricao: `${e.pedidoNumero > 0 ? `#${e.pedidoNumero}` : 'Avulsa'} - ${e.clienteNome} às ${e.horario}`,
      cor: 'indigo', icon: Truck,
    })
  })

  const ordem: Record<string, number> = {
    'conta_atrasada': 0, 'conta_hoje': 1, 'entrega_hoje': 2, 'conta_amanha': 3, 'entrega_amanha': 4,
  }
  notificacoes.sort((a, b) => (ordem[a.tipo] ?? 99) - (ordem[b.tipo] ?? 99))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const corClasses: Record<string, { bg: string; text: string; badge: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-500' },
  }

  const total = notificacoes.length
  const totalUrgentes = notificacoes.filter(n => n.tipo === 'conta_atrasada' || n.tipo === 'conta_hoje').length

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 transition" title="Notificações">
        <Bell className="w-5 h-5 text-gray-600" />
        {total > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${totalUrgentes > 0 ? 'bg-red-500' : 'bg-amber-500'} animate-pulse`}>
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[70vh] overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-[#1E3A5F] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="font-semibold text-sm">Notificações</span>
              {total > 0 && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{total}</span>}
            </div>
            <button onClick={() => setOpen(false)} className="hover:bg-white/10 p-1 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Tudo em dia!</p>
                <p className="text-xs text-gray-500 mt-1">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y">
                {notificacoes.map(n => {
                  const Icon = n.icon
                  const c = corClasses[n.cor]
                  const isConta = n.tipo.startsWith('conta')
                  return (
                    <button key={n.id}
                      onClick={() => { onNavigate(isConta ? 'financeiro' : 'entregas'); setOpen(false) }}
                      className={`w-full text-left p-3 hover:bg-gray-50 transition flex gap-3 ${n.tipo === 'conta_atrasada' ? c.bg : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${c.badge}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${c.text}`}>{n.titulo}</p>
                        <p className="text-xs text-gray-700 truncate">{n.descricao}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {n.valor !== undefined && <span className="text-xs font-bold text-gray-800">{formatMoeda(n.valor)}</span>}
                          {n.data && <span className="text-xs text-gray-500">venc: {formatDataCurta(n.data)}</span>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          {notificacoes.length > 0 && (
            <div className="p-2 border-t bg-gray-50 grid grid-cols-2 gap-2">
              <button onClick={() => { onNavigate('financeiro'); setOpen(false) }}
                className="text-xs py-2 rounded bg-[#1E3A5F] hover:bg-[#2C5282] text-white transition flex items-center justify-center gap-1">
                <DollarSign className="w-3 h-3" /> Ver Financeiro
              </button>
              <button onClick={() => { onNavigate('entregas'); setOpen(false) }}
                className="text-xs py-2 rounded bg-[#1E3A5F] hover:bg-[#2C5282] text-white transition flex items-center justify-center gap-1">
                <Truck className="w-3 h-3" /> Ver Entregas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
