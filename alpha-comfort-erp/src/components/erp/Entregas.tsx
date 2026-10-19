'use client'

import { useState } from 'react'
import { useStore, type StatusEntrega } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Truck, Clock, MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_CORES: Record<StatusEntrega, string> = {
  'Agendada': 'bg-yellow-100 text-yellow-700',
  'Em Rota': 'bg-blue-100 text-blue-700',
  'Entregue': 'bg-green-100 text-green-700',
  'Falha': 'bg-red-100 text-red-700',
}

export function Entregas() {
  const { entregas, updateEntregaStatus } = useStore()
  const [dataSel, setDataSel] = useState<Date>(new Date())

  const dataStr = dataSel.toISOString().slice(0, 10)
  const entregasDoDia = entregas.filter(e => e.dataEntrega === dataStr)
  const entregasFuturas = entregas.filter(e => e.dataEntrega > dataStr).sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega))

  const datasComEntrega = entregas.map(e => new Date(e.dataEntrega + 'T12:00:00'))

  const mudarStatus = (id: string, status: StatusEntrega) => {
    updateEntregaStatus(id, status)
    toast.success(`Status atualizado: ${status}`)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1E3A5F] flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4" />
              Calendário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={dataSel}
              onSelect={(d) => d && setDataSel(d)}
              modifiers={{ hasEvent: datasComEntrega }}
              modifiersClassnames={{
                hasEvent: 'bg-[#D69E2E]/30 font-bold',
              }}
              className="rounded-md border-0"
              locale={ptBR}
            />
          </CardContent>
        </Card>

        {/* Lista do dia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-[#1E3A5F] text-base">
              Entregas - {format(dataSel, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entregasDoDia.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhuma entrega agendada para este dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entregasDoDia.map(e => (
                  <Card key={e.id} className="border-l-4 border-l-[#1E3A5F]">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#1E3A5F]">Pedido #{e.pedidoNumero}</span>
                            <Badge className={STATUS_CORES[e.status]}>{e.status}</Badge>
                          </div>
                          <p className="font-medium">{e.clienteNome}</p>
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{e.horario}</span>
                          </div>
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{e.endereco}</span>
                          </div>
                          {e.observacoes && (
                            <p className="text-xs text-gray-500 italic">Obs: {e.observacoes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          {e.status === 'Agendada' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => mudarStatus(e.id, 'Em Rota')}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Loader2 className="w-3 h-3 mr-1" /> Em Rota
                            </Button>
                          )}
                          {e.status === 'Em Rota' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => mudarStatus(e.id, 'Entregue')}
                                className="bg-green-600 hover:bg-green-700 h-8"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" /> Entregue
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => mudarStatus(e.id, 'Falha')}
                                className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                              >
                                <XCircle className="w-3 h-3 mr-1" /> Falha
                              </Button>
                            </>
                          )}
                          {(e.status === 'Entregue' || e.status === 'Falha') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => mudarStatus(e.id, 'Agendada')}
                              className="h-8 text-xs"
                            >
                              Reabrir
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximas entregas */}
      {entregasFuturas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#1E3A5F] text-base">Próximas Entregas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entregasFuturas.slice(0, 5).map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">#{e.pedidoNumero}</span>
                    <span className="text-sm text-gray-600 ml-3">{e.clienteNome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {format(new Date(e.dataEntrega + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })} - {e.horario}
                    </span>
                    <Badge className={STATUS_CORES[e.status]}>{e.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
