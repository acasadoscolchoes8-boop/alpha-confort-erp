'use client'

import { useState } from 'react'
import { useStore, type FormaPagamento, type StatusPedido, type PedidoItem } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ShoppingCart, Plus, Trash2, Eye, FileText, Check, X, ChevronRight, Printer, Truck } from 'lucide-react'
import { formatMoeda, formatData, maskCPF } from '@/lib/utils-format'
import { toast } from 'sonner'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'

const STATUS_CORES: Record<StatusPedido, string> = {
  'Pendente': 'bg-yellow-100 text-yellow-700',
  'Pago': 'bg-blue-100 text-blue-700',
  'Em Separacao': 'bg-purple-100 text-purple-700',
  'Em Entrega': 'bg-indigo-100 text-indigo-700',
  'Concluido': 'bg-green-100 text-green-700',
  'Cancelado': 'bg-red-100 text-red-700',
}

interface FormState {
  clienteId: string
  itens: PedidoItem[]
  formaPagamento: FormaPagamento
  status: StatusPedido
  desconto: number
  observacoes: string
  precisaEntrega: boolean
}

const formInicial: FormState = {
  clienteId: '',
  itens: [],
  formaPagamento: 'PIX',
  status: 'Pendente',
  desconto: 0,
  observacoes: '',
  precisaEntrega: false,
}

export function Pedidos() {
  const { pedidos, clientes, produtos, addPedido, updatePedidoStatus, removePedido, emitirNfe, notasFiscais, usuarioLogado, addEntrega } = useStore()
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(formInicial)
  const [etapa, setEtapa] = useState(1)
  const [produtoSel, setProdutoSel] = useState('')
  const [qtd, setQtd] = useState(1)
  const [verPedido, setVerPedido] = useState<string | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)

  const filtrados = pedidos.filter(p =>
    p.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    String(p.numero).includes(busca)
  )

  const abrirNovo = () => {
    setForm(formInicial)
    setEtapa(1)
    setModalOpen(true)
  }

  const adicionarItem = () => {
    const prod = produtos.find(p => p.id === produtoSel)
    if (!prod) {
      toast.error('Selecione um produto')
      return
    }
    if (qtd <= 0) {
      toast.error('Quantidade inválida')
      return
    }
    if (qtd > prod.estoqueAtual) {
      toast.error(`Estoque insuficiente. Disponível: ${prod.estoqueAtual}`)
      return
    }
    // Verifica se já existe
    const existe = form.itens.find(i => i.produtoId === prod.id)
    if (existe) {
      toast.error('Produto já adicionado. Remova e adicione novamente com nova quantidade.')
      return
    }
    const novoItem: PedidoItem = {
      id: Math.random().toString(36).slice(2),
      produtoId: prod.id,
      modelo: prod.modelo,
      marca: prod.marca,
      medida: prod.medida,
      quantidade: qtd,
      valorUnitario: prod.valorVenda,
      subtotal: prod.valorVenda * qtd,
    }
    setForm({ ...form, itens: [...form.itens, novoItem] })
    setProdutoSel('')
    setQtd(1)
    toast.success('Item adicionado')
  }

  const removerItem = (id: string) => {
    setForm({ ...form, itens: form.itens.filter(i => i.id !== id) })
  }

  const subtotal = form.itens.reduce((s, i) => s + i.subtotal, 0)
  const total = subtotal - form.desconto

  const salvar = () => {
    if (!form.clienteId) {
      toast.error('Selecione um cliente')
      setEtapa(1)
      return
    }
    if (form.itens.length === 0) {
      toast.error('Adicione pelo menos um item')
      setEtapa(2)
      return
    }
    const cliente = clientes.find(c => c.id === form.clienteId)
    if (!cliente) return

    addPedido({
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      vendedorId: usuarioLogado!.id,
      vendedorNome: usuarioLogado!.nome,
      itens: form.itens,
      formaPagamento: form.formaPagamento,
      status: form.status,
      subtotal,
      desconto: form.desconto,
      total,
      observacoes: form.observacoes,
      precisaEntrega: form.precisaEntrega,
    })

    // Se precisar entrega e estiver pago, agendar
    if (form.precisaEntrega && (form.status === 'Pago' || form.status === 'Em Separacao' || form.status === 'Em Entrega')) {
      const dataEntrega = new Date()
      dataEntrega.setDate(dataEntrega.getDate() + 2)
      addEntrega({
        pedidoId: 'temp',
        pedidoNumero: 0,
        clienteNome: cliente.nome,
        dataEntrega: dataEntrega.toISOString().slice(0, 10),
        horario: '09:00',
        endereco: `${cliente.rua}, ${cliente.numero} - ${cliente.bairro}, ${cliente.cidade}/${cliente.estado}`,
        status: 'Agendada',
        observacoes: '',
      })
    }

    toast.success('Pedido criado com sucesso!')
    setModalOpen(false)
  }

  const pedidoVer = pedidos.find(p => p.id === verPedido)
  const nfDoPedido = (pid: string) => notasFiscais.find(n => n.pedidoId === pid)

  const confirmarExclusao = () => {
    if (excluirId) {
      removePedido(excluirId)
      toast.success('Pedido excluído')
      setExcluirId(null)
    }
  }

  const imprimirPedido = (pedidoId: string) => {
    const pedido = pedidos.find(p => p.id === pedidoId)
    if (!pedido) return
    const cliente = clientes.find(c => c.id === pedido.clienteId)

    const itensHtml = pedido.itens.map(i => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">
          <div style="font-weight:600;">${i.modelo}</div>
          <div style="font-size:11px;color:#666;">${i.marca} - ${i.medida}</div>
        </td>
        <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${i.quantidade}</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">${formatMoeda(i.valorUnitario)}</td>
        <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;font-weight:600;">${formatMoeda(i.subtotal)}</td>
      </tr>
    `).join('')

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Pedido #${pedido.numero} - Alpha Comfort</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 40px;
      color: #1E3A5F;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 3px solid #1E3A5F;
      margin-bottom: 25px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 50px;
      height: 50px;
      background: #1E3A5F;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #D69E2E;
      font-size: 28px;
    }
    .logo-text h1 {
      margin: 0;
      font-size: 22px;
      color: #1E3A5F;
    }
    .logo-text p {
      margin: 2px 0 0 0;
      font-size: 12px;
      color: #666;
    }
    .pedido-info {
      text-align: right;
    }
    .pedido-info h2 {
      margin: 0;
      font-size: 28px;
      color: #1E3A5F;
    }
    .pedido-info p {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 12px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #999;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .card {
      padding: 12px 14px;
      background: #f9fafb;
      border-left: 3px solid #1E3A5F;
      border-radius: 4px;
    }
    .card p {
      margin: 0;
      line-height: 1.6;
    }
    .card .name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    thead th {
      background: #1E3A5F;
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .totais {
      margin-left: auto;
      width: 280px;
      margin-top: 15px;
    }
    .totais .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
    }
    .totais .total {
      border-top: 2px solid #1E3A5F;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 18px;
      font-weight: 700;
      color: #1E3A5F;
    }
    .entrega-badge {
      display: inline-block;
      padding: 4px 10px;
      background: ${pedido.precisaEntrega ? '#fef3c7' : '#f3f4f6'};
      color: ${pedido.precisaEntrega ? '#92400e' : '#374151'};
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pagamento-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #1E3A5F;
      color: white;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .observacao {
      margin-top: 15px;
      padding: 10px 14px;
      background: #fff8e6;
      border: 1px dashed #D69E2E;
      border-radius: 6px;
      font-size: 12px;
    }
    .alerta-prazo {
      margin-top: 30px;
      padding: 20px;
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #D69E2E;
      border-radius: 10px;
      text-align: center;
    }
    .alerta-prazo .icon {
      font-size: 28px;
      margin-bottom: 8px;
    }
    .alerta-prazo .titulo {
      font-size: 15px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .alerta-prazo .prazo {
      font-size: 22px;
      font-weight: 800;
      color: #1E3A5F;
      margin: 8px 0;
    }
    .alerta-prazo .descricao {
      font-size: 12px;
      color: #78350f;
      line-height: 1.5;
    }
    .assinatura-area {
      margin-top: 50px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
    }
    .assinatura-area .linha {
      border-top: 1px solid #1E3A5F;
      padding-top: 8px;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 11px;
      color: #999;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">
      <div class="logo-icon">🛏</div>
      <div class="logo-text">
        <h1>Alpha Comfort Colchões</h1>
        <p>CNPJ: 12.345.678/0001-90 - Tel: (11) 3000-0000</p>
        <p>Rua das Colchas, 123 - São Paulo/SP</p>
      </div>
    </div>
    <div class="pedido-info">
      <h2>PEDIDO #${pedido.numero}</h2>
      <p>${formatData(pedido.data)}</p>
      <p>Vendedor: ${pedido.vendedorNome}</p>
    </div>
  </div>

  <div class="grid-2">
    <div class="section">
      <div class="section-title">Cliente</div>
      <div class="card">
        <p class="name">${pedido.clienteNome}</p>
        ${cliente ? `
          <p>CPF: ${cliente.cpf || '-'}</p>
          <p>Telefone: ${cliente.telefone || '-'}</p>
          ${cliente.rua ? `<p>${cliente.rua}, ${cliente.numero} - ${cliente.bairro}</p>` : ''}
          ${cliente.cidade ? `<p>${cliente.cidade} - ${cliente.estado} - CEP: ${cliente.cep || ''}</p>` : ''}
        ` : ''}
      </div>
    </div>
    <div class="section">
      <div class="section-title">Pagamento e Entrega</div>
      <div class="card">
        <p><span class="pagamento-badge">${pedido.formaPagamento}</span></p>
        <p style="margin-top:8px;"><span class="entrega-badge">${pedido.precisaEntrega ? '🚚 Com Entrega' : '🏪 Retirada na Loja'}</span></p>
        <p style="margin-top:8px;">Status: <strong>${pedido.status}</strong></p>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Itens do Pedido</div>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th style="text-align:center;">Qtd</th>
          <th style="text-align:right;">Unitário</th>
          <th style="text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itensHtml}
      </tbody>
    </table>

    <div class="totais">
      <div class="row"><span>Subtotal:</span><span>${formatMoeda(pedido.subtotal)}</span></div>
      <div class="row"><span>Desconto:</span><span>- ${formatMoeda(pedido.desconto)}</span></div>
      <div class="row total"><span>TOTAL:</span><span>${formatMoeda(pedido.total)}</span></div>
    </div>

    ${pedido.observacoes ? `
      <div class="observacao">
        <strong>Observações:</strong> ${pedido.observacoes}
      </div>
    ` : ''}
  </div>

  <div class="alerta-prazo">
    <div class="icon">📅</div>
    <div class="titulo">Prazo para Assinatura</div>
    <div class="prazo">ATÉ 25 DIAS CORRIDOS</div>
    <div class="descricao">
      O cliente tem o prazo de <strong>até 25 dias corridos</strong>, a contar da data de emissão deste pedido,
      para comparecer à loja e <strong>assinar o contrato de compra e venda</strong>.
      <br>
      Após este prazo, o pedido poderá ser cancelado e os valores restituídos conforme política da loja.
    </div>
  </div>

  <div class="assinatura-area">
    <div>
      <div class="linha">Assinatura do Cliente - ${pedido.clienteNome}</div>
    </div>
    <div>
      <div class="linha">Assinatura Loja - Alpha Comfort Colchões</div>
    </div>
  </div>

  <div class="footer">
    Alpha Comfort Colchões - CNPJ: 12.345.678/0001-90 - IE: 123.456.789.000<br>
    Este documento não tem valor fiscal. A Nota Fiscal será emitida eletronicamente.
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `

    const janela = window.open('', '_blank', 'width=800,height=900')
    if (janela) {
      janela.document.write(html)
      janela.document.close()
      toast.success('Abrindo impressão do pedido...')
    } else {
      toast.error('Bloqueador de pop-up ativo. Permita pop-ups para imprimir.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={abrirNovo} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Pedido
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">NF-e</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500 py-8">
                    Nenhum pedido encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtrados.map(p => {
                  const nf = nfDoPedido(p.id)
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">#{p.numero}</TableCell>
                      <TableCell>{p.clienteNome}</TableCell>
                      <TableCell className="text-gray-600">{formatData(p.data)}</TableCell>
                      <TableCell>{p.itens.length} item(s)</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.formaPagamento}</span>
                      </TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(v: StatusPedido) => updatePedidoStatus(p.id, v)}>
                          <SelectTrigger className="w-32 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATUS_CORES).map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatMoeda(p.total)}</TableCell>
                      <TableCell className="text-center">
                        {nf ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Autorizada</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              emitirNfe(p.id)
                              toast.success('NF-e emitida!')
                            }}
                            className="text-[#1E3A5F] h-7"
                          >
                            <FileText className="w-3 h-3 mr-1" /> Emitir
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setVerPedido(p.id)} title="Visualizar">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => imprimirPedido(p.id)} title="Imprimir">
                          <Printer className="w-4 h-4 text-[#1E3A5F]" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setExcluirId(p.id)} title="Excluir">
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

      {/* Modal Novo Pedido */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Novo Pedido
            </DialogTitle>
          </DialogHeader>

          {/* Etapas */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  etapa >= n ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {etapa > n ? <Check className="w-4 h-4" /> : n}
                </div>
                {n < 3 && <div className={`w-12 h-0.5 ${etapa > n ? 'bg-[#1E3A5F]' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {etapa === 1 ? 'Cliente' : etapa === 2 ? 'Produtos' : 'Pagamento'}
            </span>
          </div>

          {/* Etapa 1: Cliente */}
          {etapa === 1 && (
            <div className="space-y-4">
              <Label>Selecione o Cliente *</Label>
              <div className="max-h-72 overflow-y-auto border rounded-lg">
                {clientes.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setForm({ ...form, clienteId: c.id })}
                    className={`w-full flex items-center justify-between p-3 border-b last:border-0 text-left transition hover:bg-gray-50 ${
                      form.clienteId === c.id ? 'bg-blue-50 border-l-4 border-l-[#1E3A5F]' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-xs text-gray-500">{maskCPF(c.cpf)} - {c.telefone}</p>
                    </div>
                    {form.clienteId === c.id && <Check className="w-5 h-5 text-[#1E3A5F]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Etapa 2: Itens */}
          {etapa === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-8 space-y-2">
                  <Label>Produto</Label>
                  <Select value={produtoSel} onValueChange={setProdutoSel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.filter(p => p.estoqueAtual > 0).map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.modelo} - {p.marca} ({p.medida}) - Estoque: {p.estoqueAtual} - {formatMoeda(p.valorVenda)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Qtd</Label>
                  <Input type="number" min="1" value={qtd} onChange={e => setQtd(parseInt(e.target.value) || 1)} />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button onClick={adicionarItem} className="w-full bg-[#1E3A5F] hover:bg-[#2C5282]">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {form.itens.length === 0 ? (
                <p className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                  Nenhum item adicionado ainda
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Unitário</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.itens.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <p className="font-medium">{i.modelo}</p>
                          <p className="text-xs text-gray-500">{i.marca} - {i.medida}</p>
                        </TableCell>
                        <TableCell className="text-center">{i.quantidade}</TableCell>
                        <TableCell className="text-right">{formatMoeda(i.valorUnitario)}</TableCell>
                        <TableCell className="text-right font-medium">{formatMoeda(i.subtotal)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removerItem(i.id)}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Subtotal</span>
                <span className="text-xl font-bold text-[#1E3A5F]">{formatMoeda(subtotal)}</span>
              </div>
            </div>
          )}

          {/* Etapa 3: Pagamento */}
          {etapa === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PIX', 'DINHEIRO', 'CARTAO'] as FormaPagamento[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setForm({ ...form, formaPagamento: f })}
                      className={`p-3 rounded-lg border-2 transition font-medium ${
                        form.formaPagamento === f
                          ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status do Pedido</Label>
                <Select value={form.status} onValueChange={(v: StatusPedido) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_CORES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.desconto}
                  onChange={e => setForm({ ...form, desconto: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Card destacado: Marcar Entrega */}
              <div className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                form.precisaEntrega
                  ? 'border-[#D69E2E] bg-amber-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`} onClick={() => setForm({ ...form, precisaEntrega: !form.precisaEntrega })}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    form.precisaEntrega ? 'bg-[#D69E2E] border-[#D69E2E]' : 'border-gray-300'
                  }`}>
                    {form.precisaEntrega && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#D69E2E]" />
                      <span className="font-semibold text-[#1E3A5F]">Marcar para Entrega</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {form.precisaEntrega
                        ? '✓ Pedido será agendado para entrega no endereço do cliente'
                        : 'Cliente irá retirar na loja. Clique para marcar entrega.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={form.observacoes}
                  onChange={e => setForm({ ...form, observacoes: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className="p-4 bg-[#1E3A5F] text-white rounded-lg space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Subtotal</span>
                  <span>{formatMoeda(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Desconto</span>
                  <span>-{formatMoeda(form.desconto)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20 mt-2">
                  <span>Total</span>
                  <span>{formatMoeda(total)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex !justify-between">
            <Button variant="outline" onClick={() => etapa > 1 ? setEtapa(etapa - 1) : setModalOpen(false)}>
              {etapa > 1 ? 'Voltar' : 'Cancelar'}
            </Button>
            {etapa < 3 ? (
              <Button
                onClick={() => setEtapa(etapa + 1)}
                disabled={(etapa === 1 && !form.clienteId) || (etapa === 2 && form.itens.length === 0)}
                className="bg-[#1E3A5F] hover:bg-[#2C5282]"
              >
                Avançar <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={salvar} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-1" /> Finalizar Pedido
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Pedido */}
      <Dialog open={!!verPedido} onOpenChange={open => !open && setVerPedido(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">Pedido #{pedidoVer?.numero}</DialogTitle>
          </DialogHeader>
          {pedidoVer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Cliente</p>
                  <p className="font-medium">{pedidoVer.clienteNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vendedor</p>
                  <p className="font-medium">{pedidoVer.vendedorNome}</p>
                </div>
                <div>
                  <p className="text-gray-500">Data</p>
                  <p className="font-medium">{formatData(pedidoVer.data)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pagamento</p>
                  <p className="font-medium">{pedidoVer.formaPagamento}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge className={STATUS_CORES[pedidoVer.status]}>{pedidoVer.status}</Badge>
                </div>
                <div>
                  <p className="text-gray-500">Entrega</p>
                  <p className="font-medium">{pedidoVer.precisaEntrega ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidoVer.itens.map(i => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <p className="font-medium">{i.modelo}</p>
                        <p className="text-xs text-gray-500">{i.marca} - {i.medida}</p>
                      </TableCell>
                      <TableCell className="text-center">{i.quantidade}</TableCell>
                      <TableCell className="text-right">{formatMoeda(i.valorUnitario)}</TableCell>
                      <TableCell className="text-right">{formatMoeda(i.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal:</span><span>{formatMoeda(pedidoVer.subtotal)}</span></div>
                <div className="flex justify-between"><span>Desconto:</span><span>-{formatMoeda(pedidoVer.desconto)}</span></div>
                <div className="flex justify-between text-lg font-bold text-[#1E3A5F] pt-2 border-t">
                  <span>Total:</span><span>{formatMoeda(pedidoVer.total)}</span>
                </div>
              </div>

              {pedidoVer.observacoes && (
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <p className="text-gray-500 text-xs mb-1">Observações:</p>
                  <p>{pedidoVer.observacoes}</p>
                </div>
              )}

              {nfDoPedido(pedidoVer.id) && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="font-medium text-green-700">NF-e Autorizada</p>
                  <p className="text-xs text-green-600 mt-1">Chave: {nfDoPedido(pedidoVer.id)?.chave}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerPedido(null)}>Fechar</Button>
            <Button
              onClick={() => imprimirPedido(pedidoVer!.id)}
              className="bg-[#1E3A5F] hover:bg-[#2C5282]"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirId} onOpenChange={open => !open && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pedido?</AlertDialogTitle>
            <AlertDialogDescription>O pedido será removido. O estoque não será restaurado.</AlertDialogDescription>
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
