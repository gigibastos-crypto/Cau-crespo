-- ============================================================================
-- Cau Crespo — entregas e entregadores (novembro/2026)
--
-- 1. Cadastro de entregadores (motoboys) em Configurações
-- 2. Pedido ganha: forma de entrega, entregador, endereço e valor pago ao
--    entregador
--
-- A equipe toda usa (quem lança o pedido escolhe o motoboy).
-- Pode rodar de novo sem problema.
-- ============================================================================

create table if not exists couriers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  pix_key text,
  default_fee numeric(12,2),     -- valor de costume por entrega (sugestão)
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table couriers enable row level security;
drop policy if exists "staff full access" on couriers;
create policy "staff full access" on couriers
  for all to authenticated
  using (public.is_staff_member()) with check (public.is_staff_member());

alter table orders
  add column if not exists delivery_method text,
  add column if not exists courier_id uuid references couriers(id) on delete set null,
  add column if not exists delivery_address text,
  add column if not exists delivery_fee numeric(12,2);

alter table orders drop constraint if exists orders_delivery_method_check;
alter table orders add constraint orders_delivery_method_check
  check (delivery_method is null or delivery_method in ('retirada', 'motoboy', 'correios', 'outro'));

create index if not exists orders_courier_id_idx on orders(courier_id);
