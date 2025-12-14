import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnDeleteCascadeToFuncionarioRelations1765737504053 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Turnos - CASCADE (deletar turnos quando funcionário for deletado)
        await queryRunner.query(`
            ALTER TABLE "turnos_funcionario" 
            DROP CONSTRAINT IF EXISTS "FK_turnos_funcionario_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "turnos_funcionario" 
            ADD CONSTRAINT "FK_turnos_funcionario_funcionario_id" 
            FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE
        `);

        // Aberturas Caixa - CASCADE
        await queryRunner.query(`
            ALTER TABLE "aberturas_caixa" 
            DROP CONSTRAINT IF EXISTS "FK_aberturas_caixa_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "aberturas_caixa" 
            ADD CONSTRAINT "FK_aberturas_caixa_funcionario_id" 
            FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE
        `);

        // Sangrias - CASCADE
        await queryRunner.query(`
            ALTER TABLE "sangrias" 
            DROP CONSTRAINT IF EXISTS "FK_sangrias_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "sangrias" 
            ADD CONSTRAINT "FK_sangrias_funcionario_id" 
            FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE
        `);

        // Fechamentos Caixa - CASCADE
        await queryRunner.query(`
            ALTER TABLE "fechamentos_caixa" 
            DROP CONSTRAINT IF EXISTS "FK_fechamentos_caixa_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "fechamentos_caixa" 
            ADD CONSTRAINT "FK_fechamentos_caixa_funcionario_id" 
            FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE
        `);

        // Movimentações Caixa - CASCADE
        await queryRunner.query(`
            ALTER TABLE "movimentacoes_caixa" 
            DROP CONSTRAINT IF EXISTS "FK_movimentacoes_caixa_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "movimentacoes_caixa" 
            ADD CONSTRAINT "FK_movimentacoes_caixa_funcionario_id" 
            FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE
        `);

        // Pedidos - SET NULL (manter histórico)
        await queryRunner.query(`
            ALTER TABLE "pedidos" 
            DROP CONSTRAINT IF EXISTS "FK_pedidos_criado_por_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "pedidos" 
            ADD CONSTRAINT "FK_pedidos_criado_por_id" 
            FOREIGN KEY ("criado_por_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "pedidos" 
            DROP CONSTRAINT IF EXISTS "FK_pedidos_entregue_por_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "pedidos" 
            ADD CONSTRAINT "FK_pedidos_entregue_por_id" 
            FOREIGN KEY ("entregue_por_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL
        `);

        // Comandas - SET NULL (manter histórico)
        await queryRunner.query(`
            ALTER TABLE "comandas" 
            DROP CONSTRAINT IF EXISTS "FK_comandas_criado_por_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "comandas" 
            ADD CONSTRAINT "FK_comandas_criado_por_id" 
            FOREIGN KEY ("criado_por_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reverter para NO ACTION (comportamento padrão)
        await queryRunner.query(`
            ALTER TABLE "turnos_funcionario" 
            DROP CONSTRAINT IF EXISTS "FK_turnos_funcionario_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "aberturas_caixa" 
            DROP CONSTRAINT IF EXISTS "FK_aberturas_caixa_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "sangrias" 
            DROP CONSTRAINT IF EXISTS "FK_sangrias_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "fechamentos_caixa" 
            DROP CONSTRAINT IF EXISTS "FK_fechamentos_caixa_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "movimentacoes_caixa" 
            DROP CONSTRAINT IF EXISTS "FK_movimentacoes_caixa_funcionario_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "pedidos" 
            DROP CONSTRAINT IF EXISTS "FK_pedidos_criado_por_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "pedidos" 
            DROP CONSTRAINT IF EXISTS "FK_pedidos_entregue_por_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "comandas" 
            DROP CONSTRAINT IF EXISTS "FK_comandas_criado_por_id"
        `);
    }

}
