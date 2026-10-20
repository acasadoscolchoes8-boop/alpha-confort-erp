'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, type FormaPagamento, type StatusPedido, type PedidoItem, type CartaoBandeira } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ShoppingCart, Plus, Trash2, Eye, FileText, Check, X, ChevronRight, Printer, Truck, FileSignature, Link2, Copy, PenLine, ShieldCheck, ExternalLink, Clock } from 'lucide-react'
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
  parcelas: number
  bandeiraCartao: CartaoBandeira
  entregaData: string
  entregaHorario: string
  entregaEndereco: string
  entregaObservacoes: string
}

const formInicial: FormState = {
  clienteId: '',
  itens: [],
  formaPagamento: 'PIX',
  status: 'Pendente',
  desconto: 0,
  observacoes: '',
  precisaEntrega: false,
  parcelas: 1,
  bandeiraCartao: 'Visa',
  entregaData: '',
  entregaHorario: '09:00',
  entregaEndereco: '',
  entregaObservacoes: '',
}

const BANDEIRAS: { id: CartaoBandeira; nome: string; cor: string; corSecundaria: string }[] = [
  { id: 'Visa', nome: 'VISA', cor: '#1A1F71', corSecundaria: '#F7B600' },
  { id: 'Mastercard', nome: 'Mastercard', cor: '#EB001B', corSecundaria: '#F79E1B' },
  { id: 'Elo', nome: 'ELO', cor: '#000000', corSecundaria: '#FFCB05' },
  { id: 'American Express', nome: 'AMEX', cor: '#2E77BB', corSecundaria: '#006FCF' },
  { id: 'Hipercard', nome: 'Hipercard', cor: '#8B0000', corSecundaria: '#D50032' },
]

function BandeiraCartao({ bandeira, size = 'sm' }: { bandeira: CartaoBandeira; size?: 'sm' | 'md' }) {
  const config = BANDEIRAS.find(b => b.id === bandeira) || BANDEIRAS[0]
  const isMc = config.id === 'Mastercard'
  const height = size === 'sm' ? 'h-6' : 'h-8'
  const fontSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  return (
    <span
      className={`inline-flex items-center justify-center px-2 ${height} rounded font-bold text-white ${fontSize}`}
      style={{
        background: isMc
          ? `linear-gradient(90deg, ${config.cor} 0%, ${config.cor} 45%, ${config.corSecundaria} 55%, ${config.corSecundaria} 100%)`
          : `linear-gradient(135deg, ${config.cor} 0%, ${config.corSecundaria} 100%)`,
        minWidth: size === 'sm' ? '44px' : '56px',
        letterSpacing: '0.5px',
      }}
    >
      {config.nome}
    </span>
  )
}

export function Pedidos() {
  const { pedidos, clientes, produtos, addPedido, updatePedidoStatus, removePedido, emitirNfe, notasFiscais, usuarioLogado, addEntrega, registrarAceite, dadosEmpresa } = useStore()
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormState>(formInicial)
  const [etapa, setEtapa] = useState(1)
  const [produtoSel, setProdutoSel] = useState('')
  const [qtd, setQtd] = useState(1)
  const [verPedido, setVerPedido] = useState<string | null>(null)
  const [excluirId, setExcluirId] = useState<string | null>(null)
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [modalAceite, setModalAceite] = useState<string | null>(null)
  const [tabAceite, setTabAceite] = useState<'presencial' | 'online'>('presencial')
  const [aceiteCheck, setAceiteCheck] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)

  const filtrados = pedidos.filter(p =>
    p.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    String(p.numero).includes(busca)
  )

  const abrirNovo = () => {
    setForm(formInicial)
    setEtapa(1)
    setBuscaCliente('')
    setBuscaProduto('')
    setProdutoSel('')
    setQtd(1)
    setModalOpen(true)
  }

  const adicionarItem = () => {
    const prod = produtos.find(p => p.id === produtoSel)
    if (!prod) { toast.error('Selecione um produto'); return }
    if (qtd <= 0) { toast.error('Quantidade inválida'); return }
    if (qtd > prod.estoqueAtual) { toast.error(`Estoque insuficiente. Disponível: ${prod.estoqueAtual}`); return }
    const existe = form.itens.find(i => i.produtoId === prod.id)
    if (existe) { toast.error('Produto já adicionado'); return }
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
    if (!form.clienteId) { toast.error('Selecione um cliente'); setEtapa(1); return }
    if (form.itens.length === 0) { toast.error('Adicione pelo menos um item'); setEtapa(2); return }
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
      origem: 'Loja Fisica',
      parcelas: form.formaPagamento === 'CARTAO' ? form.parcelas : undefined,
      bandeiraCartao: form.formaPagamento === 'CARTAO' ? form.bandeiraCartao : undefined,
    })

    if (form.precisaEntrega) {
      let dataEntrega = form.entregaData
      if (!dataEntrega) {
        const d = new Date()
        d.setDate(d.getDate() + 2)
        dataEntrega = d.toISOString().slice(0, 10)
      }
      const enderecoEntrega = form.entregaEndereco.trim() ||
        `${cliente.rua}, ${cliente.numero} - ${cliente.bairro}, ${cliente.cidade}/${cliente.estado}`
      const pedidoCriado = useStore.getState().pedidos[0]
      addEntrega({
        pedidoId: pedidoCriado?.id || 'temp',
        pedidoNumero: pedidoCriado?.numero || 0,
        clienteNome: cliente.nome,
        dataEntrega,
        horario: form.entregaHorario || '09:00',
        endereco: enderecoEntrega,
        status: 'Agendada',
        observacoes: form.entregaObservacoes,
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

  // ====== Aceite ======
  const pedidoAceite = pedidos.find(p => p.id === modalAceite)

  const abrirAceite = (pedidoId: string) => {
    setModalAceite(pedidoId)
    setTabAceite('presencial')
    setAceiteCheck(false)
  }

  useEffect(() => {
    if (modalAceite && tabAceite === 'presencial' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = '#1E3A5F'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
      }
    }
  }, [modalAceite, tabAceite])

  const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const iniciarDesenho = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDrawingRef.current = true
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const desenhar = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getCanvasPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const pararDesenho = () => { isDrawingRef.current = false }

  const limparAssinatura = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1E3A5F'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }

  const confirmarAceitePresencial = () => {
    const canvas = canvasRef.current
    if (!canvas) { toast.error('Erro ao capturar assinatura'); return }
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      const hasInk = Array.from(imageData).some((v, i) => i % 4 === 0 && v < 250)
      if (!hasInk) { toast.error('Por favor, desenhe a assinatura do cliente'); return }
    }
    const dataUrl = canvas.toDataURL('image/png')
    registrarAceite(modalAceite!, {
      status: 'aceito',
      assinatura: dataUrl,
      tipo: 'presencial',
      userAgent: navigator.userAgent,
    })
    toast.success('✓ Aceite do cliente registrado!')
    setModalAceite(null)
  }

  const confirmarRecusa = () => {
    registrarAceite(modalAceite!, {
      status: 'recusado',
      tipo: tabAceite,
      userAgent: navigator.userAgent,
    })
    toast.info('Pedido marcado como recusado')
    setModalAceite(null)
  }

  const gerarLinkAceite = () => {
    if (!pedidoAceite) return
    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://erp.alphacomfort.com.br'}/aceite?id=${pedidoAceite.id}`
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Link copiado!')
    }).catch(() => {
      toast.error('Não foi possível copiar. Link: ' + link)
    })
  }

  const enviarWhatsApp = () => {
    if (!pedidoAceite) return
    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://erp.alphacomfort.com.br'}/aceite?id=${pedidoAceite.id}`
    const cliente = clientes.find(c => c.id === pedidoAceite.clienteId)
    const tel = cliente?.telefone?.replace(/\D/g, '') || ''
    const msg = `Olá ${pedidoAceite.clienteNome}! 🛏️\n\nSeu pedido #${pedidoAceite.numero} na Alpha Comfort Colchões está pronto para aceite.\n\nAcesse: ${link}\n\nPrazo de entrega: até 25 dias corridos da fábrica.`
    const url = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  const getBandeiraHtml = (bandeira: CartaoBandeira): string => {
    const config = BANDEIRAS.find(b => b.id === bandeira) || BANDEIRAS[0]
    const isMc = config.id === 'Mastercard'
    return `<span style="display:inline-block;padding:3px 8px;border-radius:4px;color:white;font-size:10px;font-weight:700;letter-spacing:0.5px;margin-left:6px;vertical-align:middle;background:${isMc ? `linear-gradient(90deg, ${config.cor} 0%, ${config.cor} 45%, ${config.corSecundaria} 55%, ${config.corSecundaria} 100%)` : `linear-gradient(135deg, ${config.cor} 0%, ${config.corSecundaria} 100%)`}">${config.nome}</span>`
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
    body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 40px; color: #1E3A5F; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #1E3A5F; margin-bottom: 25px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 50px; height: 50px; background: #1E3A5F; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #D69E2E; font-size: 28px; }
    .logo-text h1 { margin: 0; font-size: 22px; color: #1E3A5F; }
    .logo-text p { margin: 2px 0 0 0; font-size: 12px; color: #666; }
    .pedido-info { text-align: right; }
    .pedido-info h2 { margin: 0; font-size: 28px; color: #1E3A5F; }
    .pedido-info p { margin: 4px 0 0 0; color: #666; font-size: 12px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { padding: 12px 14px; background: #f9fafb; border-left: 3px solid #1E3A5F; border-radius: 4px; }
    .card p { margin: 0; line-height: 1.6; }
    .card .name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    thead th { background: #1E3A5F; color: white; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .totais { margin-left: auto; width: 280px; margin-top: 15px; }
    .totais .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totais .total { border-top: 2px solid #1E3A5F; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 700; color: #1E3A5F; }
    .pagamento-badge { display: inline-block; padding: 4px 12px; background: #1E3A5F; color: white; border-radius: 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
    .entrega-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .observacao { margin-top: 15px; padding: 10px 14px; background: #fff8e6; border: 1px dashed #D69E2E; border-radius: 6px; font-size: 12px; }
    .alerta-prazo { margin-top: 20px; padding: 10px 14px; background: #fef3c7; border-left: 4px solid #D69E2E; border-radius: 4px; font-size: 12px; color: #78350f; }
    .alerta-prazo strong { color: #92400e; }
    .assinatura-area { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
    .assinatura-box { text-align: center; }
    .assinatura-box .campo-assinatura { height: 90px; border-bottom: 1.5px solid #1E3A5F; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 5px; margin-bottom: 6px; position: relative; }
    .assinatura-box .campo-assinatura img { max-height: 80px; max-width: 100%; object-fit: contain; }
    .assinatura-box .campo-assinatura .linha-assinatura { width: 100%; border-bottom: 1px dashed #999; height: 1px; margin-top: 75px; }
    .assinatura-box .label-assinatura { font-size: 11px; color: #666; margin-top: 4px; }
    .assinatura-box .info-extra { font-size: 10px; color: #999; margin-top: 2px; }
    .status-aceite { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; margin-left: 6px; }
    .status-aceite.aceito { background: #dcfce7; color: #166534; }
    .status-aceite.pendente { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 11px; color: #999; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      ${dadosEmpresa?.logo
        ? `<div class="logo-icon" style="background:white;padding:4px;"><img src="${dadosEmpresa.logo}" alt="Logo" style="max-width:50px;max-height:50px;object-fit:contain;" /></div>`
        : `<div class="logo-icon">🛏</div>`
      }
      <div class="logo-text">
        <h1>${dadosEmpresa?.nomeEmpresa || 'Alpha Comfort Colchões'}</h1>
        <p>CNPJ: ${dadosEmpresa?.cnpj || '12.345.678/0001-90'} - Tel: ${dadosEmpresa?.telefone || '(11) 3000-0000'}</p>
        <p>${dadosEmpresa?.rua || 'Rua das Colchas'}, ${dadosEmpresa?.numero || '123'} - ${dadosEmpresa?.cidade || 'São Paulo'}/${dadosEmpresa?.estado || 'SP'}</p>
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
        <p>
          <span class="pagamento-badge">${pedido.formaPagamento}</span>
          ${pedido.formaPagamento === 'CARTAO' && pedido.bandeiraCartao ? getBandeiraHtml(pedido.bandeiraCartao) : ''}
        </p>
        ${pedido.formaPagamento === 'CARTAO' && pedido.parcelas ? `
          <p style="margin-top:6px;font-size:13px;">
            <strong style="color:#1E3A5F;">${pedido.parcelas}x</strong> de
            <strong style="color:#1E3A5F;">${formatMoeda(pedido.total / pedido.parcelas)}</strong>
            ${pedido.parcelas === 1
              ? '<span style="color:#16a34a;font-size:11px;"> (à vista no cartão)</span>'
              : '<span style="color:#16a34a;font-size:11px;"> (sem juros)</span>'
            }
          </p>
        ` : ''}
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

    ${pedido.observacoes ? `<div class="observacao"><strong>Observações:</strong> ${pedido.observacoes}</div>` : ''}
  </div>

  <div class="alerta-prazo">
    <strong>🚚 Prazo de Entrega:</strong> O pedido será entregue em até <strong>25 dias corridos</strong>, contados a partir da confirmação do pedido, vindo diretamente da fábrica.
  </div>

  <div class="assinatura-area">
    <div class="assinatura-box">
      <div style="font-size:12px;color:#1E3A5F;font-weight:600;margin-bottom:6px;text-align:left;">
        Assinatura do Cliente
        ${pedido.aceite?.status === 'aceito'
          ? '<span class="status-aceite aceito">✓ Aceito</span>'
          : '<span class="status-aceite pendente">⏳ Pendente</span>'
        }
      </div>
      <div class="campo-assinatura">
        ${pedido.aceite?.status === 'aceito' && pedido.aceite.assinatura
          ? `<img src="${pedido.aceite.assinatura}" alt="Assinatura do cliente" />`
          : '<div class="linha-assinatura"></div>'
        }
      </div>
      <div class="label-assinatura">${pedido.clienteNome}</div>
      ${pedido.aceite?.status === 'aceito' && pedido.aceite.data
        ? `<div class="info-extra">Aceito em: ${new Date(pedido.aceite.data).toLocaleString('pt-BR')} · ${pedido.aceite.tipo === 'online' ? '🌐 Online' : '🏬 Presencial'}</div>`
        : '<div class="info-extra">Assine acima para confirmar o pedido</div>'
      }
    </div>

    <div class="assinatura-box">
      <div style="font-size:12px;color:#1E3A5F;font-weight:600;margin-bottom:6px;text-align:left;">Assinatura da Loja</div>
      <div class="campo-assinatura"><div class="linha-assinatura"></div></div>
      <div class="label-assinatura">${dadosEmpresa?.nomeEmpresa || 'Alpha Comfort Colchões'}</div>
      <div class="info-extra">Vendedor: ${pedido.vendedorNome}</div>
    </div>
  </div>

  <div class="footer">
    ${dadosEmpresa?.nomeEmpresa || 'Alpha Comfort Colchões'} - CNPJ: ${dadosEmpresa?.cnpj || '12.345.678/0001-90'} - IE: ${dadosEmpresa?.inscricaoEstadual || '123.456.789.000'}<br>
    ${dadosEmpresa?.telefone || '(11) 3000-0000'} · ${dadosEmpresa?.email || 'contato@alphacomfort.com.br'}<br>
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
                <TableHead>Origem</TableHead>
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
                  <TableCell colSpan={10} className="text-center text-gray-500 py-8">Nenhum pedido encontrado</TableCell>
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
                        <Badge className={
                          p.origem === 'Loja Fisica' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100'
                          : p.origem === 'Mercado Livre' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                          : p.origem === 'Shopee' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                          : p.origem === 'Amazon' ? 'bg-orange-100 text-orange-900 hover:bg-orange-100'
                          : p.origem === 'Magalu' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }>
                          {p.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs inline-block w-fit">{p.formaPagamento}</span>
                            {p.formaPagamento === 'CARTAO' && p.bandeiraCartao && <BandeiraCartao bandeira={p.bandeiraCartao} />}
                          </div>
                          {p.formaPagamento === 'CARTAO' && p.parcelas && (
                            <span className="text-xs text-[#1E3A5F] font-medium">
                              {p.parcelas}x de {formatMoeda(p.total / p.parcelas)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={p.status} onValueChange={(v: StatusPedido) => updatePedidoStatus(p.id, v)}>
                          <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATUS_CORES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatMoeda(p.total)}</TableCell>
                      <TableCell className="text-center">
                        {nf ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Autorizada</Badge>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { emitirNfe(p.id); toast.success('NF-e emitida!') }} className="text-[#1E3A5F] h-7">
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
                        <Button variant="ghost" size="icon" onClick={() => abrirAceite(p.id)} title="Aceite do cliente">
                          <FileSignature className={`w-4 h-4 ${!p.aceite ? 'text-amber-500' : p.aceite.status === 'aceito' ? 'text-green-600' : p.aceite.status === 'recusado' ? 'text-red-500' : 'text-amber-500'}`} />
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
              <ShoppingCart className="w-5 h-5" /> Novo Pedido
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${etapa >= n ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {etapa > n ? <Check className="w-4 h-4" /> : n}
                </div>
                {n < 3 && <div className={`w-12 h-0.5 ${etapa > n ? 'bg-[#1E3A5F]' : 'bg-gray-200'}`} />}
              </div>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {etapa === 1 ? 'Cliente' : etapa === 2 ? 'Produtos' : 'Pagamento'}
            </span>
          </div>

          {/* Etapa 1: Cliente com busca */}
          {etapa === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Cliente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Digite o nome ou CPF do cliente..."
                    value={buscaCliente}
                    onChange={e => setBuscaCliente(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              {(() => {
                const filtradosClientes = clientes.filter(c =>
                  c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) || c.cpf.includes(buscaCliente)
                )
                return (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{filtradosClientes.length} cliente(s) encontrado(s){clientes.length !== filtradosClientes.length && ` de ${clientes.length}`}</span>
                      {form.clienteId && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setForm({ ...form, clienteId: '' })}>Limpar seleção</Button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto border rounded-lg">
                      {filtradosClientes.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Nenhum cliente encontrado</p>
                          <p className="text-xs mt-1">Cadastre o cliente na aba Clientes</p>
                        </div>
                      ) : (
                        filtradosClientes.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setForm({ ...form, clienteId: c.id })}
                            className={`w-full flex items-center justify-between p-3 border-b last:border-0 text-left transition hover:bg-gray-50 ${form.clienteId === c.id ? 'bg-blue-50 border-l-4 border-l-[#1E3A5F]' : ''}`}
                          >
                            <div>
                              <p className="font-medium">{c.nome}</p>
                              <p className="text-xs text-gray-500">{maskCPF(c.cpf)} - {c.telefone}</p>
                            </div>
                            {form.clienteId === c.id && <Check className="w-5 h-5 text-[#1E3A5F]" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )
              })()}
            </div>
          )}

          {/* Etapa 2: Itens com busca de produto */}
          {etapa === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Buscar Produto *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Digite o modelo, marca ou medida do colchão..."
                    value={buscaProduto}
                    onChange={e => setBuscaProduto(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>
              {(() => {
                const produtosDisponiveis = produtos.filter(p =>
                  p.estoqueAtual > 0 &&
                  !form.itens.some(i => i.produtoId === p.id) &&
                  (p.modelo.toLowerCase().includes(buscaProduto.toLowerCase()) ||
                   p.marca.toLowerCase().includes(buscaProduto.toLowerCase()) ||
                   p.medida.toLowerCase().includes(buscaProduto.toLowerCase()))
                )
                return (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{produtosDisponiveis.length} produto(s) disponível(is)</span>
                      {buscaProduto && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setBuscaProduto('')}>Limpar busca</Button>}
                    </div>
                    <div className="max-h-56 overflow-y-auto border rounded-lg">
                      {produtosDisponiveis.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-sm">Nenhum produto encontrado</p>
                          <p className="text-xs mt-1">{buscaProduto ? 'Tente outra busca' : 'Todos os produtos já foram adicionados'}</p>
                        </div>
                      ) : (
                        produtosDisponiveis.map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setProdutoSel(p.id); toast.info(`Produto selecionado: ${p.modelo}`) }}
                            className={`w-full flex items-center justify-between p-3 border-b last:border-0 text-left transition hover:bg-gray-50 ${produtoSel === p.id ? 'bg-blue-50 border-l-4 border-l-[#1E3A5F]' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{p.modelo}</p>
                              <p className="text-xs text-gray-500">{p.marca} - {p.medida}</p>
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                              <p className="font-bold text-[#1E3A5F]">{formatMoeda(p.valorVenda)}</p>
                              <p className="text-xs text-gray-500">Estoque: {p.estoqueAtual}</p>
                            </div>
                            {produtoSel === p.id && <Check className="w-5 h-5 text-[#1E3A5F] ml-2" />}
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )
              })()}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-8 space-y-1">
                  <Label className="text-xs text-gray-500">Produto selecionado</Label>
                  <div className="p-2 border rounded bg-gray-50 text-sm text-gray-700">
                    {produtoSel
                      ? (() => { const p = produtos.find(x => x.id === produtoSel); return p ? `${p.modelo} - ${p.marca} - ${formatMoeda(p.valorVenda)}` : 'Nenhum' })()
                      : 'Selecione um produto na lista acima'}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Qtd</Label>
                  <Input type="number" min="1" value={qtd} onChange={e => setQtd(parseInt(e.target.value) || 1)} />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button onClick={adicionarItem} disabled={!produtoSel} className="w-full bg-[#1E3A5F] hover:bg-[#2C5282] disabled:opacity-40">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {form.itens.length === 0 ? (
                <p className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">Nenhum item adicionado ainda</p>
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
                      onClick={() => setForm({ ...form, formaPagamento: f, parcelas: 1 })}
                      className={`p-3 rounded-lg border-2 transition font-medium ${form.formaPagamento === f ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bandeira + Parcelas - só quando CARTAO */}
              {form.formaPagamento === 'CARTAO' && (
                <div className="p-4 rounded-lg border-2 border-[#1E3A5F]/30 bg-blue-50/40 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-[#1E3A5F] font-semibold">Bandeira do Cartão *</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {BANDEIRAS.map(b => {
                        const isSelected = form.bandeiraCartao === b.id
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setForm({ ...form, bandeiraCartao: b.id })}
                            className={`p-2 rounded-lg border-2 transition flex items-center justify-center ${isSelected ? 'border-[#1E3A5F] bg-white shadow-md' : 'border-gray-200 bg-white/50 hover:border-gray-300'}`}
                            title={b.id}
                          >
                            <BandeiraCartao bandeira={b.id} size="md" />
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#1E3A5F]/20">
                    <Label className="text-[#1E3A5F] font-semibold">Parcelamento (escolha do cliente)</Label>
                    <span className="text-xs text-gray-500">1x a 18x</span>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {Array.from({ length: 18 }, (_, i) => i + 1).map(n => {
                      const valorParcela = total / n
                      const isSelected = form.parcelas === n
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setForm({ ...form, parcelas: n })}
                          className={`p-2 rounded border-2 transition text-center ${isSelected ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'}`}
                        >
                          <div className="text-sm font-bold">{n}x</div>
                          <div className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{formatMoeda(valorParcela)}</div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">{form.parcelas}x</span> de
                      <span className="font-bold text-[#1E3A5F] ml-1">{formatMoeda(total / form.parcelas)}</span>
                      {form.parcelas === 1
                        ? <span className="text-xs text-green-600 ml-2">(à vista no cartão)</span>
                        : <span className="text-xs text-green-600 ml-2">(sem juros)</span>
                      }
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-bold text-[#1E3A5F]">{formatMoeda(total)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status do Pedido</Label>
                <Select value={form.status} onValueChange={(v: StatusPedido) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(STATUS_CORES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input type="number" step="0.01" value={form.desconto} onChange={e => setForm({ ...form, desconto: parseFloat(e.target.value) || 0 })} />
              </div>

              {/* Marcar Entrega */}
              <div className={`p-4 rounded-lg border-2 transition cursor-pointer ${form.precisaEntrega ? 'border-[#D69E2E] bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300'}`} onClick={() => setForm({ ...form, precisaEntrega: !form.precisaEntrega })}>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${form.precisaEntrega ? 'bg-[#D69E2E] border-[#D69E2E]' : 'border-gray-300'}`}>
                    {form.precisaEntrega && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#D69E2E]" />
                      <span className="font-semibold text-[#1E3A5F]">Marcar para Entrega</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {form.precisaEntrega ? '✓ Pedido será agendado para entrega' : 'Cliente irá retirar na loja. Clique para marcar entrega.'}
                    </p>
                  </div>
                </div>
              </div>

              {form.precisaEntrega && (
                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#1E3A5F]">
                    <Truck className="w-4 h-4" /> Agendar Entrega
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Data da Entrega *</Label>
                      <Input type="date" value={form.entregaData} onChange={e => setForm({ ...form, entregaData: e.target.value })} min={new Date().toISOString().slice(0, 10)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Horário</Label>
                      <Input type="time" value={form.entregaHorario} onChange={e => setForm({ ...form, entregaHorario: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Endereço de Entrega <span className="text-gray-400 font-normal">(deixe vazio para usar o do cliente)</span></Label>
                    <Input value={form.entregaEndereco} onChange={e => setForm({ ...form, entregaEndereco: e.target.value })} placeholder="Endereço diferente do cliente (opcional)" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Observações da Entrega</Label>
                    <Input value={form.entregaObservacoes} onChange={e => setForm({ ...form, entregaObservacoes: e.target.value })} placeholder="Ex: entregar nos fundos, falar com o porteiro, etc." />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} placeholder="Opcional" />
              </div>

              <div className="p-4 bg-[#1E3A5F] text-white rounded-lg space-y-1">
                <div className="flex justify-between text-sm"><span className="text-white/80">Subtotal</span><span>{formatMoeda(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white/80">Desconto</span><span>-{formatMoeda(form.desconto)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20 mt-2"><span>Total</span><span>{formatMoeda(total)}</span></div>
              </div>
            </div>
          )}

          <DialogFooter className="flex !justify-between">
            <Button variant="outline" onClick={() => etapa > 1 ? setEtapa(etapa - 1) : setModalOpen(false)}>
              {etapa > 1 ? 'Voltar' : 'Cancelar'}
            </Button>
            {etapa < 3 ? (
              <Button onClick={() => setEtapa(etapa + 1)} disabled={(etapa === 1 && !form.clienteId) || (etapa === 2 && form.itens.length === 0)} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{pedidoVer.formaPagamento}</p>
                    {pedidoVer.formaPagamento === 'CARTAO' && pedidoVer.bandeiraCartao && <BandeiraCartao bandeira={pedidoVer.bandeiraCartao} />}
                  </div>
                  {pedidoVer.formaPagamento === 'CARTAO' && pedidoVer.parcelas && (
                    <p className="text-sm text-[#1E3A5F] font-medium mt-0.5">
                      {pedidoVer.parcelas}x de {formatMoeda(pedidoVer.total / pedidoVer.parcelas)}
                      {pedidoVer.parcelas === 1
                        ? <span className="text-xs text-green-600 ml-1">(à vista)</span>
                        : <span className="text-xs text-green-600 ml-1">(s/ juros)</span>
                      }
                    </p>
                  )}
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
                <div className="flex justify-between text-lg font-bold text-[#1E3A5F] pt-2 border-t"><span>Total:</span><span>{formatMoeda(pedidoVer.total)}</span></div>
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
            <Button onClick={() => imprimirPedido(pedidoVer!.id)} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
              <Printer className="w-4 h-4 mr-2" /> Imprimir Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Aceite */}
      <Dialog open={!!modalAceite} onOpenChange={open => !open && setModalAceite(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F] flex items-center gap-2">
              <FileSignature className="w-5 h-5" /> Aceite do Cliente - Pedido #{pedidoAceite?.numero}
            </DialogTitle>
          </DialogHeader>
          {pedidoAceite && (
            <div className="space-y-4">
              {pedidoAceite.aceite && (
                <div className={`p-3 rounded-lg border ${pedidoAceite.aceite.status === 'aceito' ? 'bg-green-50 border-green-200' : pedidoAceite.aceite.status === 'recusado' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center gap-2">
                    {pedidoAceite.aceite.status === 'aceito' && <Check className="w-5 h-5 text-green-600" />}
                    {pedidoAceite.aceite.status === 'recusado' && <X className="w-5 h-5 text-red-600" />}
                    {pedidoAceite.aceite.status === 'pendente' && <Clock className="w-5 h-5 text-yellow-600" />}
                    <div className="flex-1">
                      <p className={`font-medium ${pedidoAceite.aceite.status === 'aceito' ? 'text-green-800' : pedidoAceite.aceite.status === 'recusado' ? 'text-red-800' : 'text-yellow-800'}`}>
                        {pedidoAceite.aceite.status === 'aceito' && '✓ Aceite registrado'}
                        {pedidoAceite.aceite.status === 'recusado' && '✗ Cliente recusou o pedido'}
                        {pedidoAceite.aceite.status === 'pendente' && '⏳ Aguardando aceite'}
                      </p>
                      {pedidoAceite.aceite.data && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {pedidoAceite.aceite.tipo === 'online' ? '🌐 Online' : '🏬 Presencial'} · {formatData(pedidoAceite.aceite.data)}
                        </p>
                      )}
                    </div>
                  </div>
                  {pedidoAceite.aceite.assinatura && (
                    <div className="mt-3 p-2 bg-white rounded border">
                      <p className="text-xs text-gray-500 mb-1">Assinatura:</p>
                      <img src={pedidoAceite.aceite.assinatura} alt="Assinatura" className="max-h-24 mx-auto" />
                    </div>
                  )}
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm"><strong>Cliente:</strong> {pedidoAceite.clienteNome}</p>
                <p className="text-sm"><strong>Total:</strong> {formatMoeda(pedidoAceite.total)} · {pedidoAceite.formaPagamento}{pedidoAceite.formaPagamento === 'CARTAO' && pedidoAceite.parcelas ? ` ${pedidoAceite.parcelas}x` : ''}</p>
                <p className="text-sm"><strong>Itens:</strong> {pedidoAceite.itens.length} produto(s)</p>
              </div>

              <div className="p-3 border rounded-lg bg-amber-50/30">
                <p className="text-xs font-semibold text-[#1E3A5F] mb-1">📋 Termo de Aceite:</p>
                <p className="text-xs text-gray-700">
                  O cliente declara estar ciente e de acordo com todas as condições do pedido, incluindo valores, forma de pagamento, e o <strong>prazo de entrega de até 25 dias corridos</strong>, com entrega vindo diretamente da fábrica. Autoriza também a emissão da Nota Fiscal eletrônica.
                </p>
              </div>

              <div className="flex gap-2 border-b">
                <button onClick={() => setTabAceite('presencial')} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tabAceite === 'presencial' ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  🏬 Presencial (Loja Física)
                </button>
                <button onClick={() => setTabAceite('online')} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${tabAceite === 'online' ? 'border-[#1E3A5F] text-[#1E3A5F]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  🌐 Online (Link para Cliente)
                </button>
              </div>

              {tabAceite === 'presencial' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Peça ao cliente para assinar com o dedo (mobile) ou mouse (desktop):</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={180}
                      className="w-full h-40 cursor-crosshair touch-none"
                      onMouseDown={iniciarDesenho}
                      onMouseMove={desenhar}
                      onMouseUp={pararDesenho}
                      onMouseLeave={pararDesenho}
                      onTouchStart={iniciarDesenho}
                      onTouchMove={desenhar}
                      onTouchEnd={pararDesenho}
                    />
                    <p className="text-center text-xs text-gray-400 mt-1">Assinatura do cliente</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={limparAssinatura}>
                    <PenLine className="w-3 h-3 mr-1" /> Limpar
                  </Button>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                    <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    <span>O aceite presencial tem validade jurídica conforme CDC Art. 6º III e Marco Civil da Internet.</span>
                  </div>
                </div>
              )}

              {tabAceite === 'online' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Gere um link público e envie ao cliente por WhatsApp ou email.</p>
                  <div className="p-3 bg-gray-50 border rounded-lg">
                    <Label className="text-xs">Link de aceite do cliente:</Label>
                    <div className="flex gap-2 mt-1">
                      <Input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : 'https://erp.alphacomfort.com.br'}/aceite?id=${pedidoAceite.id}`} className="text-xs font-mono" />
                      <Button size="sm" onClick={gerarLinkAceite}><Copy className="w-3 h-3 mr-1" /> Copiar</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={enviarWhatsApp} className="bg-green-600 hover:bg-green-700">
                      <ExternalLink className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                    <Button variant="outline" onClick={gerarLinkAceite}>
                      <Link2 className="w-4 h-4 mr-2" /> Copiar Link
                    </Button>
                  </div>
                  <div className="p-3 bg-blue-50 rounded text-xs text-blue-800">
                    <p className="font-semibold mb-1">🌐 Como funciona o aceite online:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Cliente acessa o link pelo celular</li>
                      <li>Vê todos os detalhes do pedido</li>
                      <li>Lê o termo de aceite</li>
                      <li>Marca o checkbox "Li e aceito"</li>
                      <li>Assina com o dedo na tela</li>
                      <li>Sistema registra IP + data + assinatura</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex !justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              {pedidoAceite?.aceite && (
                <Button variant="outline" onClick={confirmarRecusa} className="text-red-600 border-red-200 hover:bg-red-50">
                  <X className="w-4 h-4 mr-1" /> Recusar
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalAceite(null)}>Fechar</Button>
              {tabAceite === 'presencial' && (
                <Button onClick={confirmarAceitePresencial} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 mr-1" /> Confirmar Aceite
                </Button>
              )}
            </div>
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
