-- Permite que o site público (usuário anônimo) crie um novo cliente
-- diretamente na tabela "clients" ao se cadastrar pelo site.
-- Não concede leitura/alteração/exclusão — só criação de registro novo.
create policy "public can sign up as client" on clients
  for insert
  to anon
  with check (true);
