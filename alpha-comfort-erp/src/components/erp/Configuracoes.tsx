'use client'

import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Building, Upload, Trash2, Image as ImageIcon, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

export function Configuracoes() {
  const { dadosEmpresa, updateDadosEmpresa } = useStore()
  const [form, setForm] = useState(dadosEmpresa)
  const [uploading, setUploading] = useState(false)
  const [webmaniaKey, setWebmaniaKey] = useState('')
  const [webmaniaSecret, setWebmaniaSecret] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadLogo = (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem (PNG, JPG, SVG)')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo 2MB.')
      return
    }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setForm({ ...form, logo: result })
      updateDadosEmpresa({ logo: result })
      setUploading(false)
      toast.success('Logo carregada com sucesso!')
    }
    reader.onerror = () => {
      setUploading(false)
      toast.error('Erro ao carregar a imagem.')
    }
    reader.readAsDataURL(file)
  }

  const removerLogo = () => {
    setForm({ ...form, logo: '' })
    updateDadosEmpresa({ logo: '' })
    toast.success('Logo removida')
  }

  const salvar = () => {
    updateDadosEmpresa(form)
    toast.success('Configurações salvas com sucesso!')
  }

  return (
    <div className="space-y-4">
      {/* Logo da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F] flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logotipo da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Preview da logo */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 min-h-[140px]">
              {form.logo ? (
                <img
                  src={form.logo}
                  alt="Logo da empresa"
                  className="max-h-24 max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Sem logo cadastrada</p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="md:col-span-2 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUploadLogo(file)
                  e.target.value = ''
                }}
              />

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#1E3A5F] hover:bg-[#2C5282]"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Logo
                    </>
                  )}
                </Button>
                {form.logo && (
                  <Button
                    onClick={removerLogo}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                <p className="font-semibold mb-1">📐 Especificações recomendadas:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Formato: <strong>PNG</strong> (com fundo transparente) ou <strong>SVG</strong></li>
                  <li>Tamanho ideal: <strong>200x60 pixels</strong> (formato horizontal)</li>
                  <li>Tamanho máximo do arquivo: <strong>2 MB</strong></li>
                  <li>A logo aparece no: <strong>menu lateral</strong>, <strong>impressão de pedidos</strong> e <strong>página de aceite do cliente</strong></li>
                </ul>
              </div>

              {form.logo && (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                  <Check className="w-4 h-4" />
                  <span>Logo carregada e aplicada em todo o sistema!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F] flex items-center gap-2">
            <Building className="w-5 h-5" />
            Dados da Empresa (para NF-e)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Razão Social</Label>
              <Input value={form.nomeEmpresa} onChange={e => setForm({ ...form, nomeEmpresa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input value={form.inscricaoEstadual} onChange={e => setForm({ ...form, inscricaoEstadual: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
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
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webmania */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F]">Integração Webmania (NF-e)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Consumer Key</Label>
              <Input
                value={webmaniaKey}
                onChange={e => setWebmaniaKey(e.target.value)}
                placeholder="Cole sua chave aqui"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Secret</Label>
              <Input
                value={webmaniaSecret}
                onChange={e => setWebmaniaSecret(e.target.value)}
                placeholder="Cole sua chave aqui"
                type="password"
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <p><strong>Como obter as chaves (gratuito):</strong></p>
            <ol className="list-decimal list-inside mt-1 space-y-0.5 text-xs">
              <li>Acesse webmaniabr.com/registrar/</li>
              <li>Crie conta gratuita (até 50 NF-e/mês)</li>
              <li>No painel, copie Consumer Key e Secret</li>
              <li>Cole nos campos acima e salve</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={salvar} className="bg-[#1E3A5F] hover:bg-[#2C5282]">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
