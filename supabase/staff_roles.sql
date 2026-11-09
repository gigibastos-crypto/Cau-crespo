-- ============================================================================
-- Papéis da equipe: master vs funcionário
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Papel de cada membro da equipe
-- ---------------------------------------------------------------------------
alter table staff
  add column if not exists role text not null default 'funcionario'
    check (role in ('master', 'funcionario'));

-- Marca o login real do sistema como master.
update staff set role = 'master'
where user_id = (select id from auth.users where email = 'contato@caucrespo.com.br');

-- ---------------------------------------------------------------------------
-- 2. Financeiro passa a ser só do master (dado sensível do negócio)
-- ---------------------------------------------------------------------------
drop policy if exists "staff full access" on expenses;

create policy "master full access" on expenses
  for all to authenticated
  using (exists (select 1 from staff where user_id = auth.uid() and role = 'master'))
  with check (exists (select 1 from staff where user_id = auth.uid() and role = 'master'));

-- clients, products, orders e order_items continuam "staff full access"
-- (qualquer um da equipe, master ou funcionário, usa normalmente).

-- ---------------------------------------------------------------------------
-- 3. Master pode gerenciar quem é da equipe
-- ---------------------------------------------------------------------------
create policy "master adds staff" on staff
  for insert to authenticated
  with check (exists (select 1 from staff s where s.user_id = auth.uid() and s.role = 'master'));

create policy "master updates staff" on staff
  for update to authenticated
  using (exists (select 1 from staff s where s.user_id = auth.uid() and s.role = 'master'))
  with check (exists (select 1 from staff s where s.user_id = auth.uid() and s.role = 'master'));

create policy "master removes staff" on staff
  for delete to authenticated
  using (exists (select 1 from staff s where s.user_id = auth.uid() and s.role = 'master'));

-- ---------------------------------------------------------------------------
-- 4. Funções para a tela "Equipe" (a tabela auth.users não é acessível
--    direto pelo app — essas funções fazem a ponte, com checagem de master
--    embutida, sem expor e-mails de ninguém além da equipe)
-- ---------------------------------------------------------------------------
create or replace function public.list_staff()
returns table (user_id uuid, role text, created_at timestamptz, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from staff where user_id = auth.uid() and role = 'master') then
    raise exception 'Apenas o master pode ver a equipe.';
  end if;

  return query
    select s.user_id, s.role, s.created_at, u.email
    from staff s
    join auth.users u on u.id = s.user_id
    order by s.created_at;
end;
$$;

create or replace function public.add_staff_member(target_email text, target_role text default 'funcionario')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not exists (select 1 from staff where user_id = auth.uid() and role = 'master') then
    raise exception 'Apenas o master pode adicionar funcionários.';
  end if;

  if target_role not in ('master', 'funcionario') then
    raise exception 'Papel inválido.';
  end if;

  select id into target_user_id from auth.users where email = target_email;

  if target_user_id is null then
    raise exception 'Não encontramos uma conta com esse e-mail. A pessoa precisa criar a conta primeiro — no painel do Supabase (Authentication → Users) ou se cadastrando em Minha Cau no site.';
  end if;

  insert into staff (user_id, role)
  values (target_user_id, target_role)
  on conflict (user_id) do update set role = excluded.role;
end;
$$;

create or replace function public.remove_staff_member(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_id uuid;
begin
  if not exists (select 1 from staff where user_id = auth.uid() and role = 'master') then
    raise exception 'Apenas o master pode remover funcionários.';
  end if;

  select id into target_user_id from auth.users where email = target_email;
  if target_user_id is null then
    raise exception 'Não encontramos uma conta com esse e-mail.';
  end if;

  delete from staff where user_id = target_user_id;
end;
$$;

grant execute on function public.list_staff() to authenticated;
grant execute on function public.add_staff_member(text, text) to authenticated;
grant execute on function public.remove_staff_member(text) to authenticated;
