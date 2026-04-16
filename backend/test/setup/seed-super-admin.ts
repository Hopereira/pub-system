/**
 * Helper para seed do SUPER_ADMIN nos testes E2E.
 * Deve ser chamado APÓS app.init() — o synchronize:true já criou as tabelas.
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

export async function seedSuperAdmin(
  ds: DataSource,
  email: string,
  senha: string,
): Promise<void> {
  const hash = await bcrypt.hash(senha, 10);
  const existing = await ds.query(
    `SELECT id FROM funcionarios WHERE email = $1 AND tenant_id IS NULL LIMIT 1`,
    [email],
  );
  if (existing.length > 0) {
    await ds.query(
      `UPDATE funcionarios SET senha = $1, cargo = 'SUPER_ADMIN', status = 'ATIVO' WHERE email = $2 AND tenant_id IS NULL`,
      [hash, email],
    );
  } else {
    await ds.query(
      `INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id)
       VALUES (gen_random_uuid(), 'Admin CI', $1, $2, 'SUPER_ADMIN', 'ATIVO', NULL)`,
      [email, hash],
    );
  }
}
