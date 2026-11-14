-- ============================================================================
-- Cau Crespo — precificação (novembro/2026)
--
-- Ficha de custo de cada peça do catálogo:
--   - product_cost_items: materiais e outros custos (podem vir do estoque —
--     aí usam o custo médio atual — ou ter custo digitado)
--   - product_pricing: horas de trabalho, valor da hora, margem desejada e
--     taxas (cartão, impostos), usados para sugerir o preço
--
-- Cada peça vendida guarda o custo do dia da venda (order_items.unit_cost),
-- para mostrar a margem real mesmo que o custo mude depois.
--
-- Custos e margens: só master. Rodar DEPOIS de 2026-11_estoque.sql.
-- Pode rodar de novo sem problema.
-- ============================================================================

create table if not exists product_pricing (
  product_id uuid primary key references products(id) on delete cascade,
  labor_hours numeric(8,2) not null default 0,
  hourly_rate numeric(12,2) not null default 0,
  target_margin numeric(5,2) not null default 50,  -- % do preço que sobra de lucro
  fees_pct numeric(5,2) not null default 0,        -- % do preço que vai em taxas
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists product_cost_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  stock_item_id uuid references stock_items(id) on delete set null,
  description text not null,
  quantity numeric(12,3) not null default 1,
  unit text,
  unit_cost numeric(12,4),     -- vazio + item de estoque = usa o custo médio atual
  position int not null default 0
);

create index if not exists product_cost_items_product_idx on product_cost_items(product_id);

alter table product_pricing enable row level security;
alter table product_cost_items enable row level security;

drop policy if exists "master full access" on product_pricing;
create policy "master full access" on product_pricing
  for all to authenticated using (public.is_master()) with check (public.is_master());

drop policy if exists "master full access" on product_cost_items;
create policy "master full access" on product_cost_items
  for all to authenticated using (public.is_master()) with check (public.is_master());

-- Custo de uma peça hoje (materiais + mão de obra). Vazio se não tem ficha.
create or replace function public.product_unit_cost(p_product uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with mats as (
    select sum(ci.quantity * coalesce(ci.unit_cost, si.avg_cost, 0)) as total, count(*) as n
    from product_cost_items ci
    left join stock_items si on si.id = ci.stock_item_id
    where ci.product_id = p_product
  ),
  labor as (
    select labor_hours * hourly_rate as total from product_pricing where product_id = p_product
  )
  select case
    when (select n from mats) = 0 and not exists (select 1 from labor) then null
    else coalesce((select total from mats), 0) + coalesce((select total from labor), 0)
  end;
$$;

revoke all on function public.product_unit_cost(uuid) from public, anon, authenticated;

-- Custos de todas as peças (para as telas). Só master recebe algo.
create or replace function public.product_costs()
returns table (product_id uuid, cost numeric)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, public.product_unit_cost(p.id)
  from products p
  where public.is_master();
$$;

revoke all on function public.product_costs() from public, anon;
grant execute on function public.product_costs() to authenticated;

-- Custo guardado em cada peça vendida
alter table order_items add column if not exists unit_cost numeric(12,4);

create or replace function public.order_items_fill_cost()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.unit_cost is null and new.product_id is not null then
    new.unit_cost := public.product_unit_cost(new.product_id);
  end if;
  return new;
end;
$$;

revoke all on function public.order_items_fill_cost() from public, anon, authenticated;

drop trigger if exists order_items_fill_cost on order_items;
create trigger order_items_fill_cost
  before insert on order_items
  for each row execute function public.order_items_fill_cost();
