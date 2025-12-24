-- Limpar dados de teste anteriores (UUIDs inválidos)
DELETE FROM funcionarios WHERE email IN ('admin@bardoze.com', 'admin@pubdahora.com');
DELETE FROM empresas WHERE slug IN ('bar-do-ze', 'pub-da-hora');
DELETE FROM tenants WHERE slug IN ('bar-do-ze', 'pub-da-hora');

-- Criar tenants com UUIDs válidos
INSERT INTO tenants (id, nome, slug, plano, status, created_at, updated_at)
VALUES (
  'd59f1c41-2427-45a9-8104-ba73e062ab2c',
  'Bar do Ze',
  'bar-do-ze',
  'BASIC',
  'ATIVO',
  NOW(),
  NOW()
);

INSERT INTO tenants (id, nome, slug, plano, status, created_at, updated_at)
VALUES (
  '33561e5a-ff60-4aa5-82d7-496ded76a134',
  'Pub da Hora',
  'pub-da-hora',
  'PRO',
  'ATIVO',
  NOW(),
  NOW()
);

-- Criar empresas com UUIDs válidos
INSERT INTO empresas (id, cnpj, "nomeFantasia", "razaoSocial", slug, ativo, tenant_id)
VALUES (
  '094b3097-1e23-45cf-88a2-4aa643592034',
  '11111111000111',
  'Bar do Ze',
  'Bar do Ze LTDA',
  'bar-do-ze',
  true,
  'd59f1c41-2427-45a9-8104-ba73e062ab2c'
);

INSERT INTO empresas (id, cnpj, "nomeFantasia", "razaoSocial", slug, ativo, tenant_id)
VALUES (
  '8baa4486-d14b-4961-888d-5d38f302de97',
  '22222222000222',
  'Pub da Hora',
  'Pub da Hora LTDA',
  'pub-da-hora',
  true,
  '33561e5a-ff60-4aa5-82d7-496ded76a134'
);

-- Criar funcionários com UUIDs válidos
INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id, empresa_id)
VALUES (
  '83043369-7e84-4136-b3e6-aace96438480',
  'Admin Bar do Ze',
  'admin@bardoze.com',
  (SELECT senha FROM funcionarios WHERE email = 'admin@admin.com' LIMIT 1),
  'ADMIN',
  'ATIVO',
  'd59f1c41-2427-45a9-8104-ba73e062ab2c',
  '094b3097-1e23-45cf-88a2-4aa643592034'
);

INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id, empresa_id)
VALUES (
  '19983f56-6a2e-40ed-8a5f-398d5e863d69',
  'Admin Pub da Hora',
  'admin@pubdahora.com',
  (SELECT senha FROM funcionarios WHERE email = 'admin@admin.com' LIMIT 1),
  'ADMIN',
  'ATIVO',
  '33561e5a-ff60-4aa5-82d7-496ded76a134',
  '8baa4486-d14b-4961-888d-5d38f302de97'
);
