-- ============================================================================
-- Cau Crespo — módulo Estoque (novembro/2026)
--
-- Itens de estoque de dois tipos:
--   - "peca": peça do catálogo (liga na tabela products — nome, foto e preço
--     de venda vêm de lá)
--   - "insumo": matéria-prima/material (prata, madeira, embalagem…), com
--     unidade própria (g, un, m…)
--
-- A quantidade e o CUSTO MÉDIO não são digitados: são calculados a partir das
-- movimentações (entradas com custo, saídas e ajustes de contagem). Se uma
-- movimentação for corrigida ou apagada, o item é recalculado.
--
-- Rodar DEPOIS de 2026-11_financeiro_fornecedores.sql. Pode rodar de novo.
-- ============================================================================

create or replace function public.is_staff_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

revoke all on function public.is_staff_member() from public, anon;
grant execute on function public.is_staff_member() to authenticated;

create table if not exists stock_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'peca' check (kind in ('peca', 'insumo')),
  product_id uuid unique references products(id) on delete cascade,
  name text,                    -- obrigatório para insumo; peça usa o nome do catálogo
  unit text not null default 'un',
  min_quantity numeric(12,3) not null default 0,   -- avisa quando ficar abaixo
  quantity numeric(12,3) not null default 0,       -- calculado
  avg_cost numeric(12,4) not null default 0,       -- calculado (custo médio)
  last_cost numeric(12,4),                         -- calculado (custo da última entrada)
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint stock_items_name_or_product check (product_id is not null or name is not null)
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references stock_items(id) on delete cascade,
  type text not null check (type in ('entrada', 'saida', 'ajuste')),
  quantity numeric(12,3) not null check (quantity >= 0),
  -- entrada: custo por unidade; saida: não usa; ajuste: quantity = contagem real
  unit_cost numeric(12,4),
  movement_date date not null default current_date,
  supplier_id uuid references suppliers(id) on delete set null,
  order_id uuid references orders(id) on delete set null,
  reason text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_item_idx on stock_movements(item_id, movement_date, created_at);

-- Recalcula quantidade e custo médio de um item, em ordem cronológica
create or replace function public.recalc_stock_item(p_item uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
  q numeric := 0;
  avg_c numeric := 0;
  last_c numeric := null;
begin
  for m in
    select type, quantity, unit_cost from stock_movements
    where item_id = p_item
    order by movement_date, created_at
  loop
    if m.type = 'entrada' then
      if q + m.quantity > 0 then
        avg_c := (greatest(q, 0) * avg_c + m.quantity * coalesce(m.unit_cost, avg_c)) / (greatest(q, 0) + m.quantity);
      end if;
      if m.unit_cost is not null then last_c := m.unit_cost; end if;
      q := q + m.quantity;
    elsif m.type = 'saida' then
      q := q - m.quantity;
    else -- ajuste: a contagem real passa a ser a quantidade
      q := m.quantity;
    end if;
  end loop;

  update stock_items
  set quantity = q, avg_cost = round(avg_c, 4), last_cost = last_c
  where id = p_item;
end;
$$;

create or replace function public.stock_movements_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recalc_stock_item(old.item_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalc_stock_item(new.item_id);
  end if;
  return null;
end;
$$;

drop trigger if exists stock_movements_recalc on stock_movements;
create trigger stock_movements_recalc
  after insert or update or delete on stock_movements
  for each row execute function public.stock_movements_after_change();

-- Acesso: a equipe toda usa o estoque (registrar entradas e saídas)
alter table stock_items enable row level security;
alter table stock_movements enable row level security;

drop policy if exists "staff full access" on stock_items;
create policy "staff full access" on stock_items
  for all to authenticated
  using (public.is_staff_member()) with check (public.is_staff_member());

drop policy if exists "staff full access" on stock_movements;
create policy "staff full access" on stock_movements
  for all to authenticated
  using (public.is_staff_member()) with check (public.is_staff_member());

-- Coloca todas as peças do catálogo no estoque, com quantidade zero
insert into stock_items (kind, product_id, unit)
select 'peca', p.id, 'un' from products p
on conflict (product_id) do nothing;

-- Peça nova cadastrada no catálogo já entra no estoque (quantidade zero)
create or replace function public.products_add_to_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into stock_items (kind, product_id, unit) values ('peca', new.id, 'un')
  on conflict (product_id) do nothing;
  return new;
end;
$$;

drop trigger if exists products_add_to_stock on products;
create trigger products_add_to_stock
  after insert on products
  for each row execute function public.products_add_to_stock();

revoke all on function public.recalc_stock_item(uuid) from public, anon, authenticated;
revoke all on function public.stock_movements_after_change() from public, anon, authenticated;
revoke all on function public.products_add_to_stock() from public, anon, authenticated;
