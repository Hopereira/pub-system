import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTables1765468000000 implements MigrationInterface {
  name = 'CreatePaymentTables1765468000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para planos de tenant (se não existir)
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tenant_plano_enum" AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar enum para gateways
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_gateway_enum" AS ENUM ('mercado_pago', 'pagseguro', 'picpay');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar enum para status de assinatura
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscription_status_enum" AS ENUM ('active', 'pending', 'cancelled', 'expired', 'trial');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar enum para ciclo de cobrança
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "billing_cycle_enum" AS ENUM ('monthly', 'yearly');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar enum para status de transação
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'cancelled', 'in_process');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar enum para tipo de transação
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "transaction_type_enum" AS ENUM ('subscription', 'upgrade', 'downgrade', 'renewal', 'refund');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Criar tabela payment_configs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "gateway" "payment_gateway_enum" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT false,
        "sandbox" boolean NOT NULL DEFAULT false,
        "publicKey" text,
        "accessToken" text,
        "secretKey" text,
        "webhookSecret" text,
        "additionalConfig" jsonb,
        "displayName" varchar,
        "logoUrl" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_configs_gateway" UNIQUE ("gateway")
      )
    `);

    // Criar tabela subscriptions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" uuid NOT NULL,
        "plano" "tenant_plano_enum" NOT NULL,
        "status" "subscription_status_enum" NOT NULL DEFAULT 'pending',
        "billingCycle" "billing_cycle_enum" NOT NULL DEFAULT 'monthly',
        "gateway" "payment_gateway_enum",
        "price" decimal(10,2) NOT NULL,
        "externalSubscriptionId" varchar,
        "externalCustomerId" varchar,
        "currentPeriodStart" TIMESTAMP,
        "currentPeriodEnd" TIMESTAMP,
        "trialEndsAt" TIMESTAMP,
        "cancelledAt" TIMESTAMP,
        "cancellationReason" varchar,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_tenant" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    // Criar tabela payment_transactions
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payment_transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subscriptionId" uuid,
        "tenantId" uuid NOT NULL,
        "gateway" "payment_gateway_enum" NOT NULL,
        "type" "transaction_type_enum" NOT NULL,
        "status" "transaction_status_enum" NOT NULL DEFAULT 'pending',
        "amount" decimal(10,2) NOT NULL,
        "currency" varchar NOT NULL DEFAULT 'BRL',
        "externalPaymentId" varchar,
        "externalTransactionId" varchar,
        "paymentMethod" varchar,
        "description" text,
        "failureReason" text,
        "gatewayResponse" jsonb,
        "metadata" jsonb,
        "ipAddress" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_transactions_subscription" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL
      )
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_tenant" ON "subscriptions" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_status" ON "subscriptions" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_transactions_tenant" ON "payment_transactions" ("tenantId")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_transactions_status" ON "payment_transactions" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_transactions_external" ON "payment_transactions" ("externalPaymentId")
    `);

    // Inserir configurações padrão dos gateways
    await queryRunner.query(`
      INSERT INTO "payment_configs" ("gateway", "enabled", "sandbox", "displayName", "logoUrl")
      VALUES 
        ('mercado_pago', false, true, 'Mercado Pago', 'https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/5.21.22/mercadopago/logo__large@2x.png'),
        ('pagseguro', false, true, 'PagSeguro', 'https://assets.pagseguro.com.br/ps-bootstrap/v7.2.1/svg/pagbank/logo-pagbank-icon.svg'),
        ('picpay', false, true, 'PicPay', 'https://www.picpay.com/site/images/logo-picpay.svg')
      ON CONFLICT ("gateway") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payment_configs"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "transaction_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "billing_cycle_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscription_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_gateway_enum"`);
  }
}
