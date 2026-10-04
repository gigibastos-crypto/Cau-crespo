-- ============================================================================
-- Contas de cliente ("Minha Cau") — fase 1
--
-- Corrige um problema de segurança: a regra "authenticated full access"
-- dava a QUALQUER usuário autenticado (inclusive um cliente recém-cadastrado
-- no site) acesso total de leitura e escrita a todos os clientes, pedidos e
-- despesas do negócio. Essa regra fazia sentido enquanto só a equipe tinha
-- login — agora que clientes também vão poder criar conta, ela precisa virar
-- "só a equipe", e clientes passam a enxergar apenas os próprios dados.
--
-- IMPORTANTE: antes de rodar, troque 'SEU_EMAIL_AQUI' pelo e-mail que você já
-- usa pra entrar no sistema de gestão (a conta criada em Authentication →
-- Users). Isso marca essa conta como "equipe".
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Quem é equipe (acesso total) — diferente de cliente (só os próprios dados)
-- ---------------------------------------------------------------------------
create table if not exists staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table staff enable row level security;

create policy "staff can read the staff list" on staff
  for select to authenticated
  using (exists (select 1 from staff s where s.user_id = auth.uid()));

-- Troque o e-mail abaixo pelo que você usa pra entrar no sistema de gestão.
insert into staff (user_id)
select id from auth.users where email = 'SEU_EMAIL_AQUI'
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Troca as regras antigas (qualquer autenticado) por "só equipe"
-- ---------------------------------------------------------------------------
drop policy if exists "authenticated full access" on clients;
drop policy if exists "authenticated full access" on products;
drop policy if exists "authenticated full access" on orders;
drop policy if exists "authenticated full access" on order_items;
drop policy if exists "authenticated full access" on expenses;

create policy "staff full access" on clients
  for all to authenticated
  using (exists (select 1 from staff where user_id = auth.uid()))
  with check (exists (select 1 from staff where user_id = auth.uid()));

create policy "staff full access" on products
  for all to authenticated
  using (exists (select 1 from staff where user_id = auth.uid()))
  with check (exists (select 1 from staff where user_id = auth.uid()));

create policy "staff full access" on orders
  for all to authenticated
  using (exists (select 1 from staff where user_id = auth.uid()))
  with check (exists (select 1 from staff where user_id = auth.uid()));

create policy "staff full access" on order_items
  for all to authenticated
  using (exists (select 1 from staff where user_id = auth.uid()))
  with check (exists (select 1 from staff where user_id = auth.uid()));

create policy "staff full access" on expenses
  for all to authenticated
  using (exists (select 1 from staff where user_id = auth.uid()))
  with check (exists (select 1 from staff where user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 3. Novas colunas em clients para suportar conta de cliente
-- ---------------------------------------------------------------------------
alter table clients
  add column if not exists auth_user_id uuid references auth.users(id) unique,
  add column if not exists consentimento_email boolean not null default false,
  add column if not exists consentimento_whatsapp boolean not null default false,
  add column if not exists origem_cadastro text not null default 'admin',
  add column if not exists status text not null default 'ativo'
    check (status in ('ativo', 'inativo')),
  add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 4. Cliente autenticado só enxerga e edita o próprio registro
--    (coexiste com a política "staff full access" acima — equipe continua
--    vendo todo mundo, cliente só vê a si mesmo)
-- ---------------------------------------------------------------------------
create policy "customer reads own record" on clients
  for select to authenticated
  using (auth_user_id = auth.uid());

create policy "customer updates own record" on clients
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "customer creates own record on signup" on clients
  for insert to authenticated
  with check (auth_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. Remove a política antiga de cadastro anônimo (o cadastro agora exige
--    criar conta — e-mail + senha — em vez de gravar sem autenticação)
-- ---------------------------------------------------------------------------
drop policy if exists "public can sign up as client" on clients;
