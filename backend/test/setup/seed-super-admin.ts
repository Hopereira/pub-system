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
  await ds.query(`DELETE FROM funcionarios WHERE email = $1 AND tenant_id IS NULL`, [email]);
  await ds.query(
    `INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id)
     VALUES (gen_random_uuid(), 'Admin CI', $1, $2, 'SUPER_ADMIN', 'ATIVO', NULL)`,
    [email, hash],
  );
}
