-- Cau Crespo — Catálogo inicial
-- Peças extraídas do catálogo oficial em PDF da marca (14 coleções: Beijo,
-- Bombe, Coração, Ear Cuff, Ear Hook, Entremeios, Felinos, Îakaré,
-- Metamorfose, Niemeyer, Onda, Pantera, Pepita e Wood). Rode isto depois de
-- schema.sql, no SQL Editor do Supabase, para já começar com o catálogo
-- populado em vez de cadastrar cada peça manualmente pela tela.
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
  ('Bracelete 9cm', 'Wood', 'pulseira', 'madeira', 920, 'Bracelete em madeira nobre, abertura de 9cm.', '/products/bracelete-9cm.jpg', 'ativo'),

  -- Beijo
  ('Colar Gravata', 'Beijo', 'colar', 'prata_dourado', 1520, 'Colar gravata com pingente de boca, corrente elo cartier dourada.', '/products/colar-gravata.jpg', 'ativo'),
  ('Brinco Boca', 'Beijo', 'brinco', 'prata_dourado', 1070, 'Brinco em formato de boca. Disponível em prata e dourado.', '/products/brinco-boca.jpg', 'ativo'),
  ('Pingente G com Couro', 'Beijo', 'colar', 'dourado', 1140, 'Pingente de boca grande em fio de couro preto.', '/products/pingente-g-com-couro.jpg', 'ativo'),
  ('Colar Boca', 'Beijo', 'colar', 'prata', 4200, 'Colar inteiro composto por elos em formato de boca, em prata.', '/products/colar-boca.jpg', 'ativo'),
  ('Anel Boca', 'Beijo', 'anel', 'prata_dourado', 1890, 'Anel em formato de boca. Disponível em prata e dourado.', '/products/anel-boca.jpg', 'ativo'),
  ('Pingente P com Couro', 'Beijo', 'colar', 'dourado', 835, 'Pingente de boca pequeno em fio de couro.', '/products/pingente-p-com-couro.jpg', 'ativo'),

  -- Entremeios
  ('Anel Entremeios', 'Entremeios', 'anel', 'prata_dourado', 1990, 'Anel de aros entrelaçados. Disponível em prata e dourado.', '/products/anel-entremeios.jpg', 'ativo'),

  -- Felinos
  ('Anel Dedinho Meaw', 'Felinos', 'anel', 'prata_dourado', 1180, 'Anel fininho em formato de gato, para o dedo mindinho. Disponível em prata e dourado.', '/products/anel-dedinho-meaw.jpg', 'ativo'),

  -- Îakaré
  ('Anel Îakaré', 'Îakaré', 'anel', 'prata_dourado', 2360, 'Anel em formato de jacaré. Disponível em prata e dourado.', '/products/anel-iakare.jpg', 'ativo'),
  ('Brinco Îakaré', 'Îakaré', 'brinco', 'prata_dourado', 1100, 'Brinco em formato de jacaré. Disponível em prata e dourado.', '/products/brinco-iakare.jpg', 'ativo'),

  -- Metamorfose
  ('Anel Metamorfose', 'Metamorfose', 'anel', 'prata_dourado', 2480, 'Anel com sapo dourado sobre folha de prata, olho cravejado.', '/products/anel-metamorfose.jpg', 'ativo'),

  -- Niemeyer
  ('Bracelete Niemeyer', 'Niemeyer', 'pulseira', 'prata', 6200, 'Bracelete largo em prata, com nervuras onduladas.', '/products/bracelete-niemeyer.jpg', 'ativo'),
  ('Brinco Niemeyer', 'Niemeyer', 'brinco', 'prata_dourado', 645, 'Brinco ondulado, inspirado nas curvas de Niemeyer. Disponível em prata e dourado.', '/products/brinco-niemeyer.jpg', 'ativo'),

  -- Onda
  ('Bracelete Onda', 'Onda', 'pulseira', 'prata', 5500, 'Bracelete em espiral, em prata.', '/products/bracelete-onda.jpg', 'ativo'),
  ('Anel Onda P', 'Onda', 'anel', 'prata_dourado', 1580, 'Anel em formato de onda, tamanho P. Disponível em prata e dourado.', '/products/anel-onda-p.jpg', 'ativo'),
  ('Ear Cuff Onda', 'Onda', 'brinco', 'prata_dourado', 480, 'Ear cuff em formato de onda. Disponível em prata e dourado.', '/products/ear-cuff-onda.jpg', 'ativo'),
  ('Anel Onda G', 'Onda', 'anel', 'prata_dourado', 1770, 'Anel em formato de onda, tamanho G, metade prata e metade dourado.', '/products/anel-onda-g.jpg', 'ativo'),

  -- Pantera
  ('Brinco Patinha Pantera', 'Pantera', 'brinco', 'prata_dourado', 990, 'Brinco patinha com pedra verde. Disponível em prata e dourado.', '/products/brinco-patinha-pantera.jpg', 'ativo'),
  ('Bracelete Pantera', 'Pantera', 'pulseira', 'prata_dourado', 9370, 'Bracelete rígido em formato de pantera. Disponível em prata e dourado.', '/products/bracelete-pantera.jpg', 'ativo'),
  ('Anel Pantera', 'Pantera', 'anel', 'prata_dourado', 2915, 'Anel com cabeça de pantera, olhos cravejados. Disponível em prata e dourado.', '/products/anel-pantera.jpg', 'ativo'),
  ('Chocker Pantera G', 'Pantera', 'colar', 'prata', 2960, 'Chocker rígido com cabeça e patinha de pantera, tamanho G, em prata.', '/products/chocker-pantera-g.jpg', 'ativo'),
  ('Chocker Pantera P', 'Pantera', 'colar', 'prata_dourado', 2550, 'Chocker rígido com cabeça de pantera, tamanho P. Disponível em prata e dourado.', '/products/chocker-pantera-p.jpg', 'ativo'),

  -- Wood (peças adicionais)
  ('Anel Maysa', 'Wood', 'anel', 'prata_madeira', 1220, 'Anel assimétrico em prata e madeira de reaproveitamento.', '/products/anel-maysa.jpg', 'ativo'),
  ('Anel Bolinha', 'Wood', 'anel', 'prata_madeira', 1800, 'Anel em madeira com aglomerado de bolinhas de prata.', '/products/anel-bolinha.jpg', 'ativo'),
  ('Argola Cau', 'Wood', 'brinco', 'prata_madeira', 1490, 'Argola dupla em madeira com aro de prata.', '/products/argola-cau.jpg', 'ativo'),
  ('Argola Paty', 'Wood', 'brinco', 'prata_madeira', 890, 'Argola em madeira com aplicações de prata.', '/products/argola-paty.jpg', 'ativo'),
  ('Brinco Prada', 'Wood', 'brinco', 'madeira', 1870, 'Brinco pendente em madeira com pedra cravejada no tope.', '/products/brinco-prada.jpg', 'ativo'),
  ('Bracelete Isa', 'Wood', 'pulseira', 'madeira', 680, 'Bracelete rígido em madeira de reaproveitamento.', '/products/bracelete-isa.jpg', 'ativo'),
  ('Bracelete Isa c/ Prata', 'Wood', 'pulseira', 'prata_madeira', 1570, 'Bracelete rígido em madeira com borda em prata.', '/products/bracelete-isa-prata.jpg', 'ativo'),
  ('Bracelete Gigi', 'Wood', 'pulseira', 'madeira', 980, 'Bracelete largo e curvo em madeira de reaproveitamento.', '/products/bracelete-gigi.jpg', 'ativo'),
  ('Bracelete Gigi c/ Pedra', 'Wood', 'pulseira', 'madeira', 0, 'Bracelete largo em madeira com pedra citrino cravejada. PREÇO A CONFIRMAR.', '/products/bracelete-gigi-pedra.jpg', 'ativo');
