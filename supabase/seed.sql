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
  ('Pingente Pepita G', 'Pepita', 'colar', 'prata_dourado', 2250, 'Colar com pingente pepita, tamanho G. Disponível em prata e dourado.', '/products/pingente-pepita-g.jpg', 'ativo');
