-- ============================================================================
-- Corrige recursão infinita na política de leitura da tabela staff
-- ============================================================================
-- A política antiga checava "existe uma linha em staff onde..." consultando
-- a própria tabela staff dentro da política de staff — RLS recursiva, o que
-- fazia QUALQUER leitura de staff falhar com erro 42P17 (infinite recursion
-- detected in policy for relation "staff"). Isso quebrava o login de toda a
-- equipe, master incluído.

drop policy if exists "staff can read the staff list" on staff;

create policy "staff reads own row" on staff
  for select to authenticated
  using (user_id = auth.uid());
