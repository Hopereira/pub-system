import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFuncionarioEmailUniquePerTenant1766186930942 implements MigrationInterface {
    name = 'FixFuncionarioEmailUniquePerTenant1766186930942';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove a constraint UNIQUE global do email (se existir)
        // O nome da constraint pode variar, então tentamos remover de várias formas
        await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Tenta remover constraint pelo nome padrão do TypeORM
                IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UQ_funcionarios_email' OR conname = 'funcionarios_email_key') THEN
                    ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS "UQ_funcionarios_email";
                    ALTER TABLE funcionarios DROP CONSTRAINT IF EXISTS "funcionarios_email_key";
                END IF;
                
                -- Remove qualquer índice único existente no email
                DROP INDEX IF EXISTS "UQ_funcionarios_email";
                DROP INDEX IF EXISTS "funcionarios_email_key";
                DROP INDEX IF EXISTS "idx_funcionario_email_tenant";
            END $$;
        `);

        // Cria novo índice composto único (email + tenant_id)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_funcionario_email_tenant" 
            ON funcionarios (email, tenant_id) 
            WHERE tenant_id IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove o índice composto
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_funcionario_email_tenant"`);
        
        // Restaura a constraint única global (cuidado: pode falhar se houver duplicatas)
        await queryRunner.query(`
            ALTER TABLE funcionarios 
            ADD CONSTRAINT "UQ_funcionarios_email" UNIQUE (email)
        `);
    }
}
