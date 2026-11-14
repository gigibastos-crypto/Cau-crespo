-- ============================================================================
-- Cau Crespo — módulo Financeiro + Configurações (novembro/2026)
--
-- 1. Fornecedores (cadastro em Configurações)
-- 2. Categorias de despesa editáveis (cadastro em Configurações)
-- 3. Contas a pagar: despesa ganha fornecedor, categoria editável, forma de
--    pagamento, nº do documento, observações e repetição mensal
--
-- Tudo isso é dado financeiro: só quem é "master" vê e edita.
-- Pode rodar de novo sem problema.
-- ============================================================================

-- Função "é master?" (sem recursão nas regras da tabela staff)
create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and role = 'master');
$$;

revoke all on function public.is_master() from public, anon;
grant execute on function public.is_master() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. Fornecedores
-- ---------------------------------------------------------------------------
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supplies text,                -- o que fornece (ex.: prata, embalagens, fotografia)
  document text,                -- CPF ou CNPJ
  contact_name text,
  phone text,
  email text,
  website text,                 -- site ou Instagram
  pix_key text,
  bank_info text,               -- banco, agência, conta
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table suppliers enable row level security;
drop policy if exists "master full access" on suppliers;
create policy "master full access" on suppliers
  for all to authenticated
  using (public.is_master()) with check (public.is_master());

-- ---------------------------------------------------------------------------
-- 2. Categorias de despesa
-- ---------------------------------------------------------------------------
create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  legacy_slug text unique,      -- liga às categorias antigas (texto fixo)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table expense_categories enable row level security;
drop policy if exists "master full access" on expense_categories;
create policy "master full access" on expense_categories
  for all to authenticated
  using (public.is_master()) with check (public.is_master());

insert into expense_categories (name, legacy_slug) values
  ('Matéria-prima', 'materia_prima'),
  ('Ferramentas', 'ferramentas'),
  ('Embalagem', 'embalagem'),
  ('Marketing', 'marketing'),
  ('Outro', 'outro')
on conflict (legacy_slug) do nothing;

insert into expense_categories (name) values
  ('Fotografia'), ('Frete e envios'), ('Taxas e impostos'), ('Aluguel e contas')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Contas a pagar (tabela expenses)
-- ---------------------------------------------------------------------------
alter table expenses
  add column if not exists supplier_id uuid references suppliers(id) on delete set null,
  add column if not exists category_id uuid references expense_categories(id) on delete set null,
  add column if not exists payment_method text,
  add column if not exists document_number text,
  add column if not exists notes text,
  add column if not exists series_id uuid;   -- agrupa contas repetidas (ex.: aluguel 12x)

-- a categoria agora vem da tabela expense_categories; o texto antigo fica
-- opcional (a tela antiga continua funcionando até a nova ir ao ar)
alter table expenses drop constraint if exists expenses_category_check;
alter table expenses alter column category drop not null;
alter table expenses alter column category drop default;

alter table expenses drop constraint if exists expenses_payment_method_check;
alter table expenses add constraint expenses_payment_method_check
  check (payment_method is null or payment_method in ('pix', 'boleto', 'cartao_credito', 'cartao_debito', 'transferencia', 'dinheiro', 'outro'));

-- liga despesas antigas à categoria nova correspondente
update expenses e set category_id = c.id
from expense_categories c
where e.category_id is null and c.legacy_slug = e.category;

create index if not exists expenses_due_date_idx on expenses(due_date);
create index if not exists expenses_supplier_id_idx on expenses(supplier_id);
create index if not exists expenses_category_id_idx on expenses(category_id);

-- regra de acesso de expenses usando a função (mesmo efeito: só master)
drop policy if exists "master full access" on expenses;
create policy "master full access" on expenses
  for all to authenticated
  using (public.is_master()) with check (public.is_master());

-- Fornecedores: equipe toda pode CONSULTAR (para registrar entrada no estoque);
-- só o master cadastra/edita
drop policy if exists "staff reads suppliers" on suppliers;
create policy "staff reads suppliers" on suppliers
  for select to authenticated
  using (exists (select 1 from public.staff where user_id = auth.uid()));
