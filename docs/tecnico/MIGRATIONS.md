# 🗄️ Guia Rápido de Migrations - Pub System

## O que são Migrations?

Migrations são arquivos que descrevem mudanças na estrutura do banco de dados (criar tabelas, adicionar colunas, índices, etc.). Elas garantem que o banco sempre esteja sincronizado com as entidades do código.

---

## 📋 Comandos Essenciais

### 1. Executar Migrations (Aplicar mudanças no banco)

```powershell
# Com Docker (recomendado)
docker-compose exec backend npm run typeorm:migration:run

# Sem Docker (desenvolvimento local)
cd backend
npm run typeorm:migration:run
```

**O que faz:** Aplica todas as migrations pendentes ao banco de dados.

---

### 2. Reverter última Migration

```powershell
# Com Docker
docker-compose exec backend npm run typeorm -- migration:revert

# Sem Docker
cd backend
npm run typeorm -- migration:revert
```

**⚠️ ATENÇÃO:** Isso pode causar perda de dados! Use apenas em desenvolvimento.

---

### 3. Ver status das Migrations

```powershell
# Com Docker
docker-compose exec backend npm run typeorm -- migration:show

# Sem Docker
cd backend
npm run typeorm -- migration:show
```

**O que mostra:**
- ✅ Migrations executadas
- ⏳ Migrations pendentes

---

### 4. Gerar nova Migration (baseada em mudanças nas entidades)

```powershell
# Com Docker
docker-compose exec backend npm run typeorm:migration:generate -- src/database/migrations/NomeDaMudanca

# Sem Docker
cd backend
npm run typeorm:migration:generate -- src/database/migrations/NomeDaMudanca

# Exemplo:
docker-compose exec backend npm run typeorm:migration:generate -- src/database/migrations/AddPhoneToCliente
```

**O que faz:** Compara as entidades com o banco e gera uma migration com as diferenças.

---

### 5. Criar Migration vazia (para customização manual)

```powershell
# Com Docker
docker-compose exec backend npm run typeorm -- migration:create src/database/migrations/NomeDaMudanca

# Exemplo:
docker-compose exec backend npm run typeorm -- migration:create src/database/migrations/AddIndexToProdutos
```

**Quando usar:** Quando você quer escrever SQL customizado ou fazer mudanças complexas.

---

## 🔄 Fluxo de Trabalho Típico

### Cenário 1: Primeira instalação do projeto

```powershell
# 1. Clone o projeto
git clone <repo-url>
cd pub-system

# 2. Configure o .env
Copy-Item .env.example .env
# Edite o .env com suas configurações

# 3. Inicie os containers
docker-compose up -d

# 4. Execute as migrations
docker-compose exec backend npm run typeorm:migration:run

# 5. (Opcional) Execute o seeder
docker-compose exec backend npm run seed
```

---

### Cenário 2: Adicionar nova coluna em uma entidade

Exemplo: Adicionar campo `telefone` na entidade `Cliente`

```typescript
// backend/src/modulos/cliente/entities/cliente.entity.ts
@Entity('clientes')
export class Cliente {
  // ...campos existentes...
  
  @Column({ nullable: true })
  telefone: string; // <-- NOVA COLUNA
}
```

Depois:

```powershell
# 1. Gere a migration automaticamente
docker-compose exec backend npm run typeorm:migration:generate -- src/database/migrations/AddTelefoneToCliente

# 2. Revise o arquivo gerado em:
# backend/src/database/migrations/[timestamp]-AddTelefoneToCliente.ts

# 3. Execute a migration
docker-compose exec backend npm run typeorm:migration:run

# 4. Verifique se foi aplicada
docker-compose exec backend npm run typeorm -- migration:show
```

---

### Cenário 3: Corrigir erro em migration

```powershell
# 1. Reverta a migration com erro
docker-compose exec backend npm run typeorm -- migration:revert

# 2. Corrija o arquivo da migration em:
# backend/src/database/migrations/[timestamp]-NomeDaMigration.ts

# 3. Execute novamente
docker-compose exec backend npm run typeorm:migration:run
```

---

### Cenário 4: Resetar banco completamente (DESENVOLVIMENTO APENAS!)

```powershell
# ⚠️ ISSO VAI APAGAR TODOS OS DADOS!

# 1. Pare os containers
docker-compose down

# 2. Remova os volumes (apaga o banco)
docker-compose down -v

# 3. Recrie tudo
docker-compose up -d --build

# 4. Execute as migrations
docker-compose exec backend npm run typeorm:migration:run

# 5. Execute o seeder (dados iniciais)
docker-compose exec backend npm run seed
```

---

## 🏗️ Estrutura de uma Migration

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelefoneToCliente1234567890 implements MigrationInterface {
  name = 'AddTelefoneToCliente1234567890';

  // Executado quando você roda "migration:run"
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clientes" ADD "telefone" character varying`
    );
  }

  // Executado quando você roda "migration:revert"
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clientes" DROP COLUMN "telefone"`
    );
  }
}
```

---

## ✅ Boas Práticas

### 1. **SEMPRE** execute migrations em ordem

```powershell
# Correto
docker-compose exec backend npm run typeorm:migration:run

# ❌ Não execute migrations individuais
```

### 2. **NUNCA** edite migrations já aplicadas em produção

```powershell
# ✅ Correto: Crie uma nova migration
docker-compose exec backend npm run typeorm:migration:generate -- src/database/migrations/FixClientes

# ❌ Errado: Editar migration antiga que já foi aplicada
```

### 3. **SEMPRE** teste migrations em desenvolvimento primeiro

```powershell
# 1. Teste localmente
docker-compose exec backend npm run typeorm:migration:run

# 2. Verifique se funcionou
docker-compose exec backend npm run typeorm -- migration:show

# 3. Commit e deploy para produção
```

### 4. **SEMPRE** faça backup antes de migrations em produção

```bash
# Backup do banco (exemplo)
pg_dump -h localhost -U postgres pub_system_db > backup_$(date +%Y%m%d).sql
```

### 5. **SEMPRE** revise migrations geradas automaticamente

Mesmo que geradas automaticamente, sempre abra e revise o arquivo:

```typescript
// backend/src/database/migrations/[timestamp]-NomeDaMigration.ts
```

---

## 🐛 Troubleshooting

### Erro: "QueryFailedError: relation already exists"

**Causa:** Você está tentando criar uma tabela/coluna que já existe.

**Solução:**
```powershell
# Verifique quais migrations já foram executadas
docker-compose exec backend npm run typeorm -- migration:show

# Se a migration já foi aplicada, ela não deve ser executada novamente
```

---

### Erro: "No changes in database schema were found"

**Causa:** Não há diferenças entre as entidades e o banco.

**Solução:**
```powershell
# Certifique-se de que:
# 1. Você modificou alguma entidade (@Entity)
# 2. O synchronize está false no app.module.ts
# 3. As entidades estão sendo carregadas (autoLoadEntities: true)
```

---

### Erro: "Cannot connect to database"

**Causa:** O banco não está rodando ou as credenciais estão erradas.

**Solução:**
```powershell
# 1. Verifique se o container do banco está rodando
docker-compose ps

# 2. Verifique as credenciais no .env
cat .env | Select-String "DB_"

# 3. Teste a conexão via pgAdmin
# http://localhost:8080
```

---

### Migration está "stuck" (travada)

**Causa:** Migration falhou no meio da execução.

**Solução:**
```powershell
# 1. Entre no banco via PgAdmin ou psql
# 2. Execute:
SELECT * FROM migrations;

# 3. Delete a migration travada:
DELETE FROM migrations WHERE name = 'NomeDaMigrationTravada';

# 4. Execute novamente:
docker-compose exec backend npm run typeorm:migration:run
```

---

## 📚 Comandos Avançados

### Ver SQL que será executado (sem executar)

```powershell
# Não existe comando direto, mas você pode:
# 1. Abrir o arquivo da migration
# 2. Ver o código SQL no método up()
```

### Executar SQL customizado em uma migration

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // SQL customizado
  await queryRunner.query(`
    CREATE INDEX idx_produtos_nome 
    ON produtos(nome);
  `);
  
  // Ou usar o query builder
  await queryRunner.createIndex('produtos', 
    new Index({
      name: 'idx_produtos_nome',
      columnNames: ['nome']
    })
  );
}
```

---

## 🎯 Checklist antes de fazer deploy

Antes de aplicar migrations em produção:

- [ ] Testei a migration localmente
- [ ] Revisei o código SQL gerado
- [ ] Fiz backup do banco de produção
- [ ] Tenho um plano de rollback
- [ ] Avisei a equipe sobre downtime (se necessário)
- [ ] Documentei as mudanças

---

## 📞 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs backend`
2. Veja o status: `docker-compose exec backend npm run typeorm -- migration:show`
3. Consulte a documentação do TypeORM: https://typeorm.io/migrations

---

**✨ Migrations mantêm seu banco de dados organizado e versionado!**
