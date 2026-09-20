-- Cau Crespo — Catálogo inicial
-- Peças extraídas do catálogo em PDF da marca ("parte 9": coleções Bombe,
-- Coração, Ear Cuff e Ear Hook). Rode isto depois de schema.sql, no SQL
-- Editor do Supabase, para já começar com o catálogo populado em vez de
-- cadastrar cada peça manualmente pela tela.
--
-- As fotos ficam em /public/products no projeto e são publicadas junto com
-- o site (ex.: https://SEU-DOMINIO/products/anel-bombe-p.jpg).

insert into products (name, collection, type, material, price, description, photo_url, status) values
  ('Anel Bombe P', 'Bombe', 'anel', 'prata_dourado', 1280, 'Anel bombê arredondado, tamanho P. Disponível em prata e dourado.', '/products/anel-bombe-p.jpg', 'ativo'),
  ('Anel Bombe M', 'Bombe', 'anel', 'prata_dourado', 1520, 'Anel bombê arredondado, tamanho M. Disponível em prata e dourado.', '/products/anel-bombe-m.jpg', 'ativo'),
  ('Anel Bombe G', 'Bombe', 'anel', 'prata_dourado', 2450, 'Anel bombê arredondado, tamanho G. Disponível em prata e dourado.', '/products/anel-bombe-g.jpg', 'ativo'),
  ('Anel Coração', 'Coração', 'anel', 'prata_dourado', 2550, 'Anel com coração em relevo. Disponível em prata e dourado.', '/products/anel-coracao.jpg', 'ativo'),
  ('Pingente Coração', 'Coração', 'colar', 'prata_dourado', 1290, 'Colar com pingente de coração. Disponível em prata e dourado.', '/products/pingente-coracao.jpg', 'ativo'),
  ('Ear Cuff Fios', 'Ear Cuff', 'brinco', 'prata_dourado', 795, 'Ear cuff em fios enrolados. Disponível em prata e dourado.', '/products/ear-cuff-fios.jpg', 'ativo'),
  ('Ear Cuff Circle P', 'Ear Cuff', 'brinco', 'prata_dourado', 580, 'Ear cuff circular, tamanho P.', '/products/ear-cuff-circle-p.jpg', 'ativo'),
  ('Ear Cuff Circle M', 'Ear Cuff', 'brinco', 'prata_dourado', 1170, 'Ear cuff circular, tamanho M.', '/products/ear-cuff-circle-m.jpg', 'ativo'),
  ('Ear Cuff G', 'Ear Cuff', 'brinco', 'prata_dourado', 1280, 'Ear cuff tamanho G. Disponível em prata e dourado.', '/products/ear-cuff-g.jpg', 'ativo'),
  ('Ear Hook Un', 'Ear Hook', 'brinco', 'prata_dourado', 390, 'Ear hook vendido em unidade (avulso). Disponível em prata e dourado.', '/products/ear-hook-un.jpg', 'ativo'),
  ('Pingente Pepita P', 'Pepita', 'colar', 'prata_dourado', 1670, 'Colar com pingente pepita, tamanho P. Disponível em prata e dourado.', '/products/pingente-pepita-p.jpg', 'ativo'),
  ('Pingente Pepita G', 'Pepita', 'colar', 'prata_dourado', 2250, 'Colar com pingente pepita, tamanho G. Disponível em prata e dourado.', '/products/pingente-pepita-g.jpg', 'ativo'),
  ('Bracelete Patinha', 'Wood', 'pulseira', 'prata_madeira', 1650, 'Bracelete em madeira de reaproveitamento com aplicações de prata.', '/products/bracelete-patinha.jpg', 'ativo'),
  ('Bracelete +Patinha', 'Wood', 'pulseira', 'prata_madeira', 1800, 'Bracelete em madeira de reaproveitamento com mais aplicações de prata.', '/products/bracelete-mais-patinha.jpg', 'ativo'),
  ('Bracelete Uruá', 'Wood', 'pulseira', 'madeira', 900, 'Bracelete torneado em madeira nobre de reaproveitamento.', '/products/bracelete-urua.jpg', 'ativo'),
  ('Pingente de Madeira', 'Wood', 'colar', 'madeira', 380, 'Pingente vazado em madeira, usado em fita de cetim.', '/products/pingente-madeira.jpg', 'ativo'),
  ('Bracelete Facetado', 'Wood', 'pulseira', 'madeira', 680, 'Bracelete em madeira com faces geométricas talhadas à mão.', '/products/bracelete-facetado.jpg', 'ativo'),
  ('Bracelete 7cm', 'Wood', 'pulseira', 'madeira', 870, 'Bracelete em madeira nobre, abertura de 7cm.', '/products/bracelete-7cm.jpg', 'ativo'),
  ('Bracelete 9cm', 'Wood', 'pulseira', 'madeira', 920, 'Bracelete em madeira nobre, abertura de 9cm.', '/products/bracelete-9cm.jpg', 'ativo');
