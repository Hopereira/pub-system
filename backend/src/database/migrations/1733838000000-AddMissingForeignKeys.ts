import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingForeignKeys1733838000000 implements MigrationInterface {
  name = 'AddMissingForeignKeys1733838000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se FK já existe antes de criar
    const fkEmpresa = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'funcionarios' AND constraint_name = 'FK_funcionarios_empresa'
    `);

    if (fkEmpresa.length === 0) {
      // Adicionar FK para empresa_id em funcionarios
      await queryRunner.query(`
        ALTER TABLE funcionarios 
        ADD CONSTRAINT FK_funcionarios_empresa 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
      `);
    }

    const fkAmbiente = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints 
      WHERE table_name = 'funcionarios' AND constraint_name = 'FK_funcionarios_ambiente'
    `);

    if (fkAmbiente.length === 0) {
      // Adicionar FK para ambiente_id em funcionarios (nullable)
      await queryRunner.query(`
        ALTER TABLE funcionarios 
        ADD CONSTRAINT FK_funcionarios_ambiente 
        FOREIGN KEY (ambiente_id) REFERENCES ambientes(id) ON DELETE SET NULL
      `);
    }

    // Adicionar índices para melhor performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_funcionarios_empresa ON funcionarios(empresa_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_funcionarios_ambiente ON funcionarios(ambiente_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_comandas_mesa ON comandas("mesaId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_pedidos_comanda ON pedidos("comandaId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS IDX_movimentacoes_abertura ON movimentacoes_caixa(abertura_caixa_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_movimentacoes_abertura`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_pedidos_comanda`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_comandas_mesa`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_funcionarios_ambiente`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_funcionarios_empresa`);

    // Remover FKs
    await queryRunner.query(`
      ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS FK_funcionarios_ambiente
    `);
    await queryRunner.query(`
      ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS FK_funcionarios_empresa
    `);
  }
}
