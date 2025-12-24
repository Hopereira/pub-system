import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddSlugToEmpresas1765462000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna slug
    await queryRunner.addColumn(
      'empresas',
      new TableColumn({
        name: 'slug',
        type: 'varchar',
        length: '100',
        isNullable: true, // Temporariamente nullable para migração
        isUnique: true,
      }),
    );

    // Adicionar coluna ativo para controle de status
    const table = await queryRunner.getTable('empresas');
    const ativoColumn = table?.findColumnByName('ativo');
    
    if (!ativoColumn) {
      await queryRunner.addColumn(
        'empresas',
        new TableColumn({
          name: 'ativo',
          type: 'boolean',
          default: true,
        }),
      );
    }

    // Gerar slugs para empresas existentes baseado no nomeFantasia
    await queryRunner.query(`
      UPDATE empresas 
      SET slug = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            TRANSLATE("nomeFantasia", 'áàãâéèêíìîóòõôúùûçÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
            '[^a-zA-Z0-9]+', '-', 'g'
          ),
          '^-|-$', '', 'g'
        )
      )
      WHERE slug IS NULL
    `);

    // Criar índice para busca rápida por slug
    await queryRunner.createIndex(
      'empresas',
      new TableIndex({
        name: 'idx_empresas_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('empresas', 'idx_empresas_slug');
    await queryRunner.dropColumn('empresas', 'slug');
    
    const table = await queryRunner.getTable('empresas');
    if (table?.findColumnByName('ativo')) {
      await queryRunner.dropColumn('empresas', 'ativo');
    }
  }
}
