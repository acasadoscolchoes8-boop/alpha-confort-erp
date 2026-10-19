# 🛏️ Alpha Comfort ERP - Sistema de Gestão para Loja de Colchões

Sistema completo de gestão para loja de colchões com:
- ✅ Login com 2 perfis (admin/vendedor) + usuários personalizados com permissões
- ✅ Clientes com ViaCEP automático
- ✅ Produtos + Estoque + Importar/Exportar CSV
- ✅ Pedidos com parcelamento 1x-18x + bandeiras (Visa, Master, Elo, Amex, Hipercard)
- ✅ Impressão de pedido com logo + assinatura + prazo 25 dias
- ✅ Entregas com calendário
- ✅ Financeiro com lucro líquido (desconta taxas + comissão 5%)
- ✅ Aceite presencial e online (link público com assinatura)
- ✅ Notificações de contas vencidas + entregas do dia
- ✅ Marketplaces (ML, Shopee, Amazon, Magalu, Americanas)
- ✅ Upload de logo da empresa
- ✅ Dados salvos no navegador (localStorage) - persiste ao recarregar

## 🚀 Como publicar na Vercel (GRÁTIS)

Leia o arquivo **TUTORIAL-DEPLOY-VERCEL.md** (tem na pasta download).
Resumo rápido:
1. Baixar este código
2. Subir pro GitHub (use GitHub Desktop)
3. Conectar Vercel ao GitHub
4. Deploy automático
5. URL: `https://seu-projeto.vercel.app`

## 👥 Logins padrão

| Perfil | Email | Senha |
|---|---|---|
| Admin | admin@alpha.com | 123456 |
| Vendedor | vendedor@alpha.com | 123456 |

⚠️ **Mude a senha do admin após o primeiro login!**

## 🛠️ Tecnologias

- **Next.js 16** (React 19)
- **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **Zustand** (estado global com persistência em localStorage)
- **react-day-picker** (calendário)
- **recharts** (gráficos)
- **react-hook-form + zod** (formulários)
- **sonner** (notificações)

## 💾 Como os dados são salvos

Os dados são salvos no **localStorage** do navegador. Isso significa:
- ✅ Dados persistem ao recarregar a página
- ✅ Funciona offline depois de carregar
- ✅ 100% grátis (sem banco de dados)
- ⚠️ Cada navegador/computador tem seus próprios dados
- ⚠️ Limpar cache do navegador = perder dados

Para versão profissional com banco de dados real (Supabase/Neon), contrate um desenvolvedor.

## 📞 Suporte

Este é um protótipo funcional. Para customizações, contrate um desenvolvedor React/Next.js.
