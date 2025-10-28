-- Criar usuário admin se não existir
INSERT INTO funcionarios (id, nome, email, senha, cargo)
SELECT 
    gen_random_uuid(),
    'Administrador',
    'admin@admin.com',
    'admin123',  -- Senha sem hash para testes (conforme comentário no código)
    'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM funcionarios WHERE email = 'admin@admin.com'
);

-- Verificar se foi criado
SELECT id, nome, email, cargo FROM funcionarios WHERE email = 'admin@admin.com';
