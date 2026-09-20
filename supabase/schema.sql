-- Cau Crespo — Gestão
-- Sistema interno de acompanhamento: clientes, catálogo (feito sob encomenda,
-- sem estoque de peças prontas), pedidos/vendas e financeiro (receitas e
-- contas a pagar), com vendas pelo ateliê, WhatsApp e Instagram.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Clientes
-- ---------------------------------------------------------------------------
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cpf text,
  email text,
  phone text,
  instagram text,
  preferred_contact text
    check (preferred_contact in ('whatsapp', 'telefone', 'email', 'instagram')),
  birth_date date,
  is_vip boolean not null default false,
  cep text,
  street text,
  address_number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catálogo de peças
-- Como as peças são autorais e feitas sob encomenda, não existe "quantidade
-- em estoque": o catálogo é o modelo/design, não um item físico já pronto.
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'outro'
    check (type in ('anel', 'colar', 'brinco', 'pulseira', 'broche', 'outro')),
  material text not null default 'prata'
    check (material in ('prata', 'madeira', 'prata_madeira', 'outro')),
  price numeric(10,2) not null default 0,
  description text,
  photo_url text,
  status text not null default 'ativo' check (status in ('ativo', 'pausado')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pedidos (cada pedido é feito sob encomenda, a partir de um contato pelo
-- ateliê, WhatsApp ou Instagram)
-- ---------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  channel text not null default 'whatsapp'
    check (channel in ('atelie', 'whatsapp', 'instagram')),
  status text not null default 'encomendado'
    check (status in ('encomendado', 'em_producao', 'pronto', 'entregue', 'cancelado')),
  payment_status text not null default 'pendente'
    check (payment_status in ('pendente', 'pago')),
  order_date date not null default current_date,
  delivery_date date,
  total_value numeric(10,2) not null default 0,
  material_cost numeric(10,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists orders_client_id_idx on orders(client_id);

-- Itens de um pedido (uma ou mais peças; permite peça customizada fora do
-- catálogo, por isso product_id é opcional e description sempre existe)
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  unit_price numeric(10,2) not null default 0,
  quantity integer not null default 1
);

create index if not exists order_items_order_id_idx on order_items(order_id);

-- ---------------------------------------------------------------------------
-- Financeiro: despesas / contas a pagar
-- A receita já vem dos pedidos (orders.total_value + payment_status), então
-- aqui só ficam os custos: matéria-prima, ferramentas, embalagem, etc.
-- ---------------------------------------------------------------------------
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text not null default 'outro'
    check (category in ('materia_prima', 'ferramentas', 'embalagem', 'marketing', 'outro')),
  amount numeric(10,2) not null default 0,
  due_date date,
  paid_at date,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS — sistema de uso interno de um único negócio: qualquer usuário
-- autenticado (a dona e quem ela convidar no Supabase) pode ler e escrever.
-- Ninguém não autenticado tem acesso a nada.
-- ---------------------------------------------------------------------------
alter table clients enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table expenses enable row level security;

create policy "authenticated full access" on clients
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on products
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on orders
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on order_items
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on expenses
  for all to authenticated using (true) with check (true);
