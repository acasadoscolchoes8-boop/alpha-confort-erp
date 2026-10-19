'use client'

import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatMoeda, formatData } from '@/lib/utils-format'

export function NotasFiscais() {
  const notasFiscais = useStore(s => s.notasFiscais)

  const autorizadas = notasFiscais.filter(n => n.status === 'Autorizada').length
  const valorTotal = notasFiscais.filter(n => n.status === 'Autorizada').reduce((s, n) => s + n.valor, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Notas Autorizadas</p>
              <p className="text-2xl font-bold text-green-600">{autorizadas}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-300" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#1E3A5F]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Valor Total Emitido</p>
              <p className="text-2xl font-bold text-[#1E3A5F]">{formatMoeda(valorTotal)}</p>
            </div>
            <FileText className="w-8 h-8 text-[#1E3A5F]/30" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Total de Notas</p>
              <p className="text-2xl font-bold text-amber-600">{notasFiscais.length}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-300" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F]">Notas Fiscais Emitidas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data Emissão</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Chave de Acesso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notasFiscais.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhuma nota fiscal emitida ainda.
                    <br />
                    <span className="text-xs">Vá em Pedidos e clique em "Emitir NF-e"</span>
                  </TableCell>
                </TableRow>
              ) : (
                notasFiscais.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">#{n.pedidoNumero}</TableCell>
                    <TableCell>{n.clienteNome}</TableCell>
                    <TableCell className="text-gray-600">{formatData(n.data)}</TableCell>
                    <TableCell className="text-right font-medium">{formatMoeda(n.valor)}</TableCell>
                    <TableCell className="text-center">
                      {n.status === 'Autorizada' ? (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" /> Autorizada
                        </Badge>
                      ) : n.status === 'Rejeitada' ? (
                        <Badge className="bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3 mr-1" /> Rejeitada
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">
                          <Clock className="w-3 h-3 mr-1" /> Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">
                      {n.chave.slice(0, 22)}...
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Sobre a emissão de NF-e</p>
              <p className="text-blue-700 mt-1">
                Este é um protótipo demonstrativo. Na versão final integrada com a Webmania (gratuito até 50 NF-e/mês),
                as notas serão emitidas automaticamente para a SEFAZ e você poderá baixar o XML e PDF.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
