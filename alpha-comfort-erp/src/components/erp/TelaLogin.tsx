'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BedDouble } from 'lucide-react'
import { toast } from 'sonner'

export function TelaLogin() {
  const login = useStore(s => s.login)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const ok = login(email, senha)
    if (!ok) {
      toast.error('Email ou senha inválidos')
    } else {
      toast.success('Bem-vindo!')
    }
    setLoading(false)
  }

  const preencher = (e: string) => {
    setEmail(e)
    setSenha('123456')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E3A5F] via-[#2C5282] to-[#1E3A5F] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#1E3A5F] to-[#2C5282] rounded-2xl flex items-center justify-center mb-3 shadow-lg">
              <BedDouble className="w-9 h-9 text-[#D69E2E]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1E3A5F]">Alpha Comfort</h1>
            <p className="text-sm text-gray-500">Sistema de Gestão - Colchões</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={loading || !email || !senha}
              className="w-full bg-[#1E3A5F] hover:bg-[#2C5282] text-white h-11"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-2">Contas de demonstração (clique para preencher):</p>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => preencher('admin@alpha.com')}
                className="w-full text-left p-2 bg-white rounded border hover:bg-amber-100 transition"
              >
                <span className="font-semibold text-amber-700">Admin</span> — admin@alpha.com / 123456
              </button>
              <button
                onClick={() => preencher('vendedor@alpha.com')}
                className="w-full text-left p-2 bg-white rounded border hover:bg-amber-100 transition"
              >
                <span className="font-semibold text-amber-700">Vendedor</span> — vendedor@alpha.com / 123456
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-white/70 text-xs mt-4">
          © 2025 Alpha Comfort Colchões - Protótipo
        </p>
      </div>
    </div>
  )
}
