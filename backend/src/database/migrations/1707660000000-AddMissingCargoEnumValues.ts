import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para adicionar valores faltantes ao enum funcionarios_cargo_enum
 * 
 * Valores originais: ADMIN, CAIXA, GARCOM, COZINHA
 * Valores a adicionar: SUPER_ADMIN, GERENTE, COZINHEIRO, BARTENDER
 * 
 * Esta migration é segura para produção - apenas adiciona valores, não remove.
 */
export class AddMissingCargoEnumValues1707660000000 implements MigrationInterface {
  name = 'AddMissingCargoEnumValues1707660000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar se o enum existe
    const enumExists = await queryRunner.query(`
      SELECT 1 FROM pg_type WHERE typname = 'funcionarios_cargo_enum'
    `);

    if (enumExists.length === 0) {
      // Se o enum não existe, criar com todos os valores
      await queryRunner.query(`
        CREATE TYPE "public"."funcionarios_cargo_enum" AS ENUM(
          'SUPER_ADMIN', 'ADMIN', 'GERENTE', 'CAIXA', 'GARCOM', 'COZINHEIRO', 'COZINHA', 'BARTENDER'
        )
      `);
      console.log('✅ Enum funcionarios_cargo_enum criado com todos os valores');
      return;
    }

    // Adicionar valores faltantes ao enum existente
    // PostgreSQL permite adicionar valores com ALTER TYPE ... ADD VALUE
    
    const valuesToAdd = ['SUPER_ADMIN', 'GERENTE', 'COZINHEIRO', 'BARTENDER'];
    
    for (const value of valuesToAdd) {
      try {
        // Verificar se o valor já existe
        const valueExists = await queryRunner.query(`
          SELECT 1 FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'funcionarios_cargo_enum')
          AND enumlabel = $1
        `, [value]);

        if (valueExists.length === 0) {
          // Adicionar o valor ao enum
          // Nota: ADD VALUE não pode ser executado dentro de uma transação em algumas versões do PostgreSQL
          // Por isso usamos IF NOT EXISTS (PostgreSQL 9.3+)
          await queryRunner.query(`
            ALTER TYPE "public"."funcionarios_cargo_enum" ADD VALUE IF NOT EXISTS '${value}'
          `);
          console.log(`✅ Valor '${value}' adicionado ao enum funcionarios_cargo_enum`);
        } else {
          console.log(`ℹ️ Valor '${value}' já existe no enum funcionarios_cargo_enum`);
        }
      } catch (error) {
        // Se o valor já existe, ignora o erro
        if (error.message?.includes('already exists')) {
          console.log(`ℹ️ Valor '${value}' já existe no enum`);
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Migration AddMissingCargoEnumValues concluída');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ⚠️ ATENÇÃO: Remover valores de enum no PostgreSQL é complexo e pode quebrar dados existentes
    // Esta migration de rollback apenas documenta o que foi feito, não reverte automaticamente
    
    console.log('⚠️ AVISO: Rollback de valores de enum não é recomendado.');
    console.log('Se necessário, faça manualmente:');
    console.log('1. Crie um novo enum sem os valores');
    console.log('2. Atualize a coluna para usar o novo enum');
    console.log('3. Remova o enum antigo');
    console.log('4. Renomeie o novo enum');
    
    // Não executamos nada automaticamente para evitar perda de dados
  }
}
