# Cau Crespo — Gestão

Sistema interno de acompanhamento do ateliê Cau Crespo (joias autorais em
prata e madeira nobre de reaproveitamento, feitas sob encomenda).

Como as peças são feitas uma a uma a partir do pedido do cliente (pelo
Instagram, WhatsApp ou no ateliê), não existe controle de "estoque de peças
prontas" — o que este sistema controla é:

- **Clientes**: quem compra, contato (WhatsApp/Instagram) e observações.
- **Catálogo**: os modelos/desenhos que servem de referência (nome, tipo,
  material, preço, foto).
- **Pedidos**: cada encomenda — cliente, canal de venda (ateliê, WhatsApp ou
  Instagram), peça(s), valor, status (Encomendado → Em produção → Pronto →
  Entregue) e se já foi pago.
- **Financeiro**: receita (a partir dos pedidos pagos), custos de material por
  pedido e contas a pagar (matéria-prima, ferramentas, embalagem, marketing),
  com um painel de lucro estimado do mês.

O site de vendas (loja virtual) é um projeto separado — este é o painel de
uso interno para a Claudia acompanhar clientes, pedidos e financeiro.

## Como colocar isso no ar — passo a passo

### 1. Criar o projeto no Supabase
1. Crie uma conta em [supabase.com](https://supabase.com) (o plano gratuito
   serve para começar).
2. Crie um novo projeto.
3. Vá em **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em
   "Run". Isso cria todas as tabelas e as regras de segurança.
4. Vá em **Authentication → Users** e crie o primeiro usuário (seu e-mail e
   senha) — marque "Auto Confirm User".
5. Em **Project Settings → API**, copie a "Project URL" e a chave
   "anon public".

### 2. Rodar o projeto localmente (para testar antes de publicar)
```
npm install
cp .env.example .env
# cole a URL e a chave do Supabase no .env
npm run dev
```

### 3. Publicar (Vercel)
1. Crie uma conta em [vercel.com](https://vercel.com) e importe este
   repositório (`gigibastos-crypto/cau-crespo`).
2. Em **Settings → Environment Variables**, adicione as mesmas variáveis do
   `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Em **Deployments**, publique (o `vercel.json` já configura o roteamento
   das páginas).

## O que ainda falta (próximos passos)
- Integração com a loja virtual (para descontar/pausar um modelo do catálogo
  quando ele for vendido em outro canal).
- Anexar comprovantes/fotos aos pedidos.
- Relatório financeiro por período (hoje o painel só mostra o mês atual).
- Mais de um usuário com login próprio (hoje qualquer login criado no
  Supabase tem acesso total, o que é suficiente para um único negócio).
