'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, Save, Building } from 'lucide-react'
import { toast } from 'sonner'

export function Configuracoes() {
  const usuarios = useStore(s => s.usuarios)
  const usuarioLogado = useStore(s => s.usuarioLogado)
  const [config, setConfig] = useState({
    nomeEmpresa: 'Alpha Comfort Colchões',
    cnpj: '12.345.678/0001-90',
    inscricaoEstadual: '123.456.789.000',
    cep: '01001-000',
    rua: 'Rua das Colchas, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    telefone: '(11) 3000-0000',
    email: 'contato@alphacomfort.com.br',
    webmaniaKey: '',
    webmaniaSecret: '',
  })

  const salvar = () => {
    toast.success('Configurações salvas (demo)')
  }

  return (
    <div className="space-y-4">
      {/* Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#1E3A5F] flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    u.role === 'admin' ? 'bg-[#1E3A5F] text-white' : 'bg-[#D69E2E] text-[#1E3A5F]'
                  }`}>
                    {u.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{u.nome}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={u.role === 'admin' ? 'bg-[#1E3A5F] text-white' : 'bg-[#D69E2E] text-[#1E3A5F]'}>
                    {u.role === 'admin' ? 'Administrador' : 'Vendedor'}
                  </Badge>
                  {u.id === usuarioLogado?.id && (
                    <span className="text-xs text-gray-500">(você)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Permissões:</strong>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-xs">
              <li><strong>Admin</strong>: acesso total (dashboard, clientes, produtos, estoque, pedidos, entregas, NF-e, configurações)</li>
              <li><strong>Vendedor</strong>: apenas pedidos, estoque e entregas</li>
            </ul>
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
              <Input value={config.nomeEmpresa} onChange={e => setConfig({ ...config, nomeEmpresa: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input value={config.cnpj} onChange={e => setConfig({ ...config, cnpj: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Inscrição Estadual</Label>
              <Input value={config.inscricaoEstadual} onChange={e => setConfig({ ...config, inscricaoEstadual: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input value={config.cep} onChange={e => setConfig({ ...config, cep: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input value={config.rua} onChange={e => setConfig({ ...config, rua: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={config.cidade} onChange={e => setConfig({ ...config, cidade: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input value={config.estado} onChange={e => setConfig({ ...config, estado: e.target.value.toUpperCase().slice(0, 2) })} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={config.telefone} onChange={e => setConfig({ ...config, telefone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={config.email} onChange={e => setConfig({ ...config, email: e.target.value })} />
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
                value={config.webmaniaKey}
                onChange={e => setConfig({ ...config, webmaniaKey: e.target.value })}
                placeholder="Cole sua chave aqui"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Consumer Secret</Label>
              <Input
                value={config.webmaniaSecret}
                onChange={e => setConfig({ ...config, webmaniaSecret: e.target.value })}
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
