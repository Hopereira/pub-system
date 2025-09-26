import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1758901990644 implements MigrationInterface {
    name = 'InitialSchema1758901990644'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "clientes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cpf" character varying NOT NULL, "nome" character varying, "email" character varying, "celular" character varying, CONSTRAINT "UQ_fd1214820b9f05720b26a917630" UNIQUE ("cpf"), CONSTRAINT "UQ_3cd5652ab34ca1a0a2c7a255313" UNIQUE ("email"), CONSTRAINT "PK_d76bf3571d906e4e86470482c08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "produtos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying NOT NULL, "descricao" character varying, "preco" numeric(10,2) NOT NULL, "categoria" character varying NOT NULL, "urlImagem" character varying(512), "ativo" boolean NOT NULL DEFAULT true, "ambienteId" uuid, CONSTRAINT "PK_a5d976312809192261ed96174f3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."itens_pedido_status_enum" AS ENUM('FEITO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')`);
        await queryRunner.query(`CREATE TABLE "itens_pedido" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantidade" integer NOT NULL, "precoUnitario" numeric(10,2) NOT NULL, "observacao" character varying(255), "status" "public"."itens_pedido_status_enum" NOT NULL DEFAULT 'FEITO', "motivoCancelamento" character varying(255), "pedidoId" uuid, "produtoId" uuid, CONSTRAINT "PK_34ba752329a604381e367c431ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."pedidos_status_enum" AS ENUM('FEITO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE', 'CANCELADO')`);
        await queryRunner.query(`CREATE TABLE "pedidos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."pedidos_status_enum" NOT NULL DEFAULT 'FEITO', "total" numeric(10,2) NOT NULL DEFAULT '0', "data" TIMESTAMP NOT NULL DEFAULT now(), "motivoCancelamento" character varying(255), "comandaId" uuid, CONSTRAINT "PK_ebb5680ed29a24efdc586846725" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."comandas_status_enum" AS ENUM('ABERTA', 'FECHADA', 'PAGA')`);
        await queryRunner.query(`CREATE TABLE "comandas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."comandas_status_enum" NOT NULL DEFAULT 'ABERTA', "mesaId" uuid, "clienteId" uuid, CONSTRAINT "PK_f2a79c4679e1b8f6342d758f964" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."mesas_status_enum" AS ENUM('LIVRE', 'OCUPADA', 'RESERVADA', 'AGUARDANDO_PAGAMENTO')`);
        await queryRunner.query(`CREATE TABLE "mesas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "numero" integer NOT NULL, "status" "public"."mesas_status_enum" NOT NULL DEFAULT 'LIVRE', "ambiente_id" uuid, CONSTRAINT "UQ_de482eb027afeca7f01c967e236" UNIQUE ("numero", "ambiente_id"), CONSTRAINT "PK_ccff054bd3dad6539869d03350c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."ambientes_tipo_enum" AS ENUM('PREPARO', 'ATENDIMENTO')`);
        await queryRunner.query(`CREATE TABLE "ambientes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(100) NOT NULL, "descricao" text, "tipo" "public"."ambientes_tipo_enum" NOT NULL DEFAULT 'ATENDIMENTO', "is_ponto_de_retirada" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_fe6aee014c0235d9a1aaaa0245f" UNIQUE ("nome"), CONSTRAINT "PK_a90809c19133ae8e8739e6a0038" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "empresas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "cnpj" character varying NOT NULL, "nomeFantasia" character varying NOT NULL, "razaoSocial" character varying NOT NULL, "telefone" character varying, "endereco" character varying, CONSTRAINT "UQ_f5ed71aeb4ef47f95df5f8830b8" UNIQUE ("cnpj"), CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."funcionarios_cargo_enum" AS ENUM('ADMIN', 'CAIXA', 'GARCOM', 'COZINHA')`);
        await queryRunner.query(`CREATE TABLE "funcionarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying NOT NULL, "email" character varying NOT NULL, "senha" character varying NOT NULL, "cargo" "public"."funcionarios_cargo_enum" NOT NULL DEFAULT 'GARCOM', CONSTRAINT "UQ_5536df94d421db7d1a1ba832f0f" UNIQUE ("email"), CONSTRAINT "PK_a6ee7c0e30d968db531ad073337" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "paginas_evento" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying(100) NOT NULL, "url_imagem" text NOT NULL, "ativa" boolean NOT NULL DEFAULT true, "criado_em" TIMESTAMP NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9cd8a83a55186b10f83ffea76bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "eventos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "titulo" character varying NOT NULL, "descricao" text, "dataEvento" TIMESTAMP NOT NULL, "urlImagem" character varying, CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "produtos" ADD CONSTRAINT "FK_daf6d14dbfbb283e0a7741a3ba0" FOREIGN KEY ("ambienteId") REFERENCES "ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "itens_pedido" ADD CONSTRAINT "FK_ab2b96858c45196d22cce672215" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "itens_pedido" ADD CONSTRAINT "FK_496c47b9befb817d2595f65a901" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pedidos" ADD CONSTRAINT "FK_361c6c207367cbe221559bec811" FOREIGN KEY ("comandaId") REFERENCES "comandas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comandas" ADD CONSTRAINT "FK_daefbeebfbc0738515616077aa3" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comandas" ADD CONSTRAINT "FK_7f075e9a5fb43047f0b86c52142" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "mesas" ADD CONSTRAINT "FK_12bb24cf56933ea8077059a09d8" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mesas" DROP CONSTRAINT "FK_12bb24cf56933ea8077059a09d8"`);
        await queryRunner.query(`ALTER TABLE "comandas" DROP CONSTRAINT "FK_7f075e9a5fb43047f0b86c52142"`);
        await queryRunner.query(`ALTER TABLE "comandas" DROP CONSTRAINT "FK_daefbeebfbc0738515616077aa3"`);
        await queryRunner.query(`ALTER TABLE "pedidos" DROP CONSTRAINT "FK_361c6c207367cbe221559bec811"`);
        await queryRunner.query(`ALTER TABLE "itens_pedido" DROP CONSTRAINT "FK_496c47b9befb817d2595f65a901"`);
        await queryRunner.query(`ALTER TABLE "itens_pedido" DROP CONSTRAINT "FK_ab2b96858c45196d22cce672215"`);
        await queryRunner.query(`ALTER TABLE "produtos" DROP CONSTRAINT "FK_daf6d14dbfbb283e0a7741a3ba0"`);
        await queryRunner.query(`DROP TABLE "eventos"`);
        await queryRunner.query(`DROP TABLE "paginas_evento"`);
        await queryRunner.query(`DROP TABLE "funcionarios"`);
        await queryRunner.query(`DROP TYPE "public"."funcionarios_cargo_enum"`);
        await queryRunner.query(`DROP TABLE "empresas"`);
        await queryRunner.query(`DROP TABLE "ambientes"`);
        await queryRunner.query(`DROP TYPE "public"."ambientes_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "mesas"`);
        await queryRunner.query(`DROP TYPE "public"."mesas_status_enum"`);
        await queryRunner.query(`DROP TABLE "comandas"`);
        await queryRunner.query(`DROP TYPE "public"."comandas_status_enum"`);
        await queryRunner.query(`DROP TABLE "pedidos"`);
        await queryRunner.query(`DROP TYPE "public"."pedidos_status_enum"`);
        await queryRunner.query(`DROP TABLE "itens_pedido"`);
        await queryRunner.query(`DROP TYPE "public"."itens_pedido_status_enum"`);
        await queryRunner.query(`DROP TABLE "produtos"`);
        await queryRunner.query(`DROP TABLE "clientes"`);
    }

}
