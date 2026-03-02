import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsFromOldMigrations1760100000000 implements MigrationInterface {
  name = 'AddMissingColumnsFromOldMigrations1760100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar colunas de timestamps e responsáveis em itens_pedido
    await queryRunner.query(`
      ALTER TABLE "itens_pedido" 
      ADD COLUMN IF NOT EXISTS "iniciadoEm" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "quase_pronto_em" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "prontoEm" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "retirado_em" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "entregueEm" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "canceladoEm" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "tempo_preparo_minutos" DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS "tempo_reacao_minutos" DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS "tempo_entrega_final_minutos" DECIMAL(5,2),
      ADD COLUMN IF NOT EXISTS "tempoentregaminutos" INTEGER,
      ADD COLUMN IF NOT EXISTS "responsavel_inicio_id" UUID,
      ADD COLUMN IF NOT EXISTS "responsavel_pronto_id" UUID,
      ADD COLUMN IF NOT EXISTS "responsavel_cancelamento_id" UUID
    `);

    // Adicionar colunas de entrega em itens_pedido
    await queryRunner.query(`
      ALTER TABLE "itens_pedido"
      ADD COLUMN IF NOT EXISTS "ambiente_retirada_id" UUID,
      ADD COLUMN IF NOT EXISTS "retirado_por_garcom_id" UUID,
      ADD COLUMN IF NOT EXISTS "garcom_entrega_id" UUID
    `);

    // Adicionar status QUASE_PRONTO ao enum se não existir
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'QUASE_PRONTO' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'itens_pedido_status_enum')
        ) THEN
          ALTER TYPE "itens_pedido_status_enum" ADD VALUE 'QUASE_PRONTO';
        END IF;
      END $$;
    `);

    // Adicionar status RETIRADO ao enum se não existir
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'RETIRADO' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'itens_pedido_status_enum')
        ) THEN
          ALTER TYPE "itens_pedido_status_enum" ADD VALUE 'RETIRADO';
        END IF;
      END $$;
    `);

    // Adicionar colunas em funcionarios
    await queryRunner.query(`
      ALTER TABLE "funcionarios"
      ADD COLUMN IF NOT EXISTS "empresa_id" UUID,
      ADD COLUMN IF NOT EXISTS "ambiente_id" UUID,
      ADD COLUMN IF NOT EXISTS "status" VARCHAR DEFAULT 'ATIVO'
    `);

    // Adicionar coluna empresa_id em pontos_entrega
    await queryRunner.query(`
      ALTER TABLE "pontos_entrega"
      ADD COLUMN IF NOT EXISTS "empresa_id" UUID
    `);

    // Adicionar colunas de ambiente e ponto de entrega em clientes
    await queryRunner.query(`
      ALTER TABLE "clientes"
      ADD COLUMN IF NOT EXISTS "ambiente_id" UUID,
      ADD COLUMN IF NOT EXISTS "ponto_entrega_id" UUID
    `);

    // Adicionar colunas criado_por em pedidos
    await queryRunner.query(`
      ALTER TABLE "pedidos"
      ADD COLUMN IF NOT EXISTS "criado_por_id" UUID,
      ADD COLUMN IF NOT EXISTS "criado_por_tipo" VARCHAR,
      ADD COLUMN IF NOT EXISTS "entregue_por_id" UUID,
      ADD COLUMN IF NOT EXISTS "entregue_em" TIMESTAMP,
      ADD COLUMN IF NOT EXISTS "tempo_total_minutos" DECIMAL(5,2)
    `);

    // Adicionar colunas criado_por em comandas
    await queryRunner.query(`
      ALTER TABLE "comandas"
      ADD COLUMN IF NOT EXISTS "criado_por_id" UUID,
      ADD COLUMN IF NOT EXISTS "criado_por_tipo" VARCHAR
    `);

    // Criar tabela avaliacoes se não existir
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "avaliacoes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "comandaId" UUID NOT NULL,
        "clienteId" UUID,
        "nota" INTEGER NOT NULL,
        "comentario" TEXT,
        "tempoEstadia" INTEGER,
        "valorGasto" DECIMAL(10,2) NOT NULL,
        "criadoEm" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_avaliacao_comanda" FOREIGN KEY ("comandaId") REFERENCES "comandas"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_avaliacao_cliente" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL
      )
    `);

    // Criar tabela turnos_funcionario se não existir
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "turnos_funcionario" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "funcionario_id" UUID NOT NULL,
        "checkIn" TIMESTAMP NOT NULL,
        "checkOut" TIMESTAMP,
        "horasTrabalhadas" INTEGER,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "evento_id" UUID,
        "criadoEm" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_turno_funcionario" FOREIGN KEY ("funcionario_id") REFERENCES "funcionarios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_turno_evento" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE SET NULL
      )
    `);

    // Criar foreign keys
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_item_pedido_ambiente_retirada'
        ) THEN
          ALTER TABLE "itens_pedido" 
          ADD CONSTRAINT "FK_item_pedido_ambiente_retirada" 
          FOREIGN KEY ("ambiente_retirada_id") REFERENCES "ambientes"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_item_pedido_retirado_por_garcom'
        ) THEN
          ALTER TABLE "itens_pedido" 
          ADD CONSTRAINT "FK_item_pedido_retirado_por_garcom" 
          FOREIGN KEY ("retirado_por_garcom_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_item_pedido_garcom_entrega'
        ) THEN
          ALTER TABLE "itens_pedido" 
          ADD CONSTRAINT "FK_item_pedido_garcom_entrega" 
          FOREIGN KEY ("garcom_entrega_id") REFERENCES "funcionarios"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover foreign keys
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP CONSTRAINT IF EXISTS "FK_item_pedido_garcom_entrega"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP CONSTRAINT IF EXISTS "FK_item_pedido_retirado_por_garcom"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP CONSTRAINT IF EXISTS "FK_item_pedido_ambiente_retirada"`);

    // Remover colunas
    await queryRunner.query(`ALTER TABLE "clientes" DROP COLUMN IF EXISTS "ponto_entrega_id"`);
    await queryRunner.query(`ALTER TABLE "clientes" DROP COLUMN IF EXISTS "ambiente_id"`);
    await queryRunner.query(`ALTER TABLE "pontos_entrega" DROP COLUMN IF EXISTS "empresa_id"`);
    await queryRunner.query(`ALTER TABLE "funcionarios" DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE "funcionarios" DROP COLUMN IF EXISTS "ambiente_id"`);
    await queryRunner.query(`ALTER TABLE "funcionarios" DROP COLUMN IF EXISTS "empresa_id"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "garcomEntregaId"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "retiradoPorGarcomId"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "ambienteRetiradaId"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "responsavel_cancelamento_id"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "responsavel_pronto_id"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "responsavel_inicio_id"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "tempo_preparo_minutos"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "canceladoEm"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "entregueEm"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "retiradoEm"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "prontoEm"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "quaseProntoEm"`);
    await queryRunner.query(`ALTER TABLE "itens_pedido" DROP COLUMN IF EXISTS "iniciadoEm"`);
  }
}
