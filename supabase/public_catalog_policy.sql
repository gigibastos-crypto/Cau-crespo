-- Libera leitura pública (sem login) do catálogo para o site de vendas
-- (cau-crespo-site), mostrando só as peças ativas. Clientes, pedidos e
-- financeiro continuam só acessíveis por login — isso não muda nada disso.
create policy "public can read active products" on products
  for select to anon using (status = 'ativo');
