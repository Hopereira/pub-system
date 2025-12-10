# Correção: Tabela turnos_funcionario Faltante

## 📋 Problema Identificado

Ao tentar fazer check-in na área do garçom, o sistema retornava erro 500:

```
QueryFailedError: relation "turnos_funcionario" does not exist
```

### Logs do Erro

**Frontend**:
```
[CLIENT] ❌ [00:04:59] [API] 🔥 POST /turnos/check-in - Falhou
[CLIENT] ❌ [00:04:59] [API] Erro interno do servidor
Erro ao fazer check-in: AxiosError
```

**Backend**:
```
[Nest] 51  - 11/12/2025, 3:06:48 AM   ERROR [HTTP] ❌ ERRO: POST /turnos/check-in | 
relation "turnos_funcionario" does not exist | Tempo: 7ms

QueryFailedError: relation "turnos_funcionario" does not exist
    at PostgresQueryRunner.query
    at async TurnoService.checkIn
```

**Database**:
```sql
ERROR:  relation "turnos_funcionario" does not exist at character 2693
STATEMENT:  SELECT DISTINCT "distinctAlias"."TurnoFuncionario_id" 
FROM "turnos_funcionario" "TurnoFuncionario"
```

## 🔍 Causa Raiz

A entidade `TurnoFuncionario` existe no código:
- **Arquivo**: `backend/src/modulos/turno/entities/turno-funcionario.entity.ts`
- **Tabela**: `turnos_funcionario`

Porém, **nenhuma migration criava essa tabela** no banco de dados.

## ✅ Solução Implementada

### 1. **Adicionado na Migration Consolidada**

**Arquivo**: `backend/src/database/migrations/1760100000000-AddMissingColumnsFromOldMigrations.ts`

```typescript
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
```

### 2. **Criado Manualmente no Banco**

Para resolver o problema imediato, a tabela foi criada manualmente:

```sql
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
);
```

## 📊 Estrutura da Tabela

### Colunas

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | UUID | NOT NULL | uuid_generate_v4() | Identificador único |
| `funcionario_id` | UUID | NOT NULL | - | ID do funcionário |
| `checkIn` | TIMESTAMP | NOT NULL | - | Data/hora de entrada |
| `checkOut` | TIMESTAMP | NULL | - | Data/hora de saída |
| `horasTrabalhadas` | INTEGER | NULL | - | Tempo trabalhado em minutos |
| `ativo` | BOOLEAN | NOT NULL | true | Se o turno está ativo |
| `evento_id` | UUID | NULL | - | ID do evento (opcional) |
| `criadoEm` | TIMESTAMP | NOT NULL | now() | Data de criação |

### Foreign Keys

1. **FK_turno_funcionario**
   - Coluna: `funcionario_id`
   - Referência: `funcionarios(id)`
   - On Delete: CASCADE

2. **FK_turno_evento**
   - Coluna: `evento_id`
   - Referência: `eventos(id)`
   - On Delete: SET NULL

## 🎯 Funcionalidade

A tabela `turnos_funcionario` é usada para:

1. **Controle de Ponto**
   - Registrar entrada (check-in)
   - Registrar saída (check-out)
   - Calcular horas trabalhadas

2. **Gestão de Turnos**
   - Verificar se funcionário está em turno ativo
   - Histórico de turnos
   - Relatórios de presença

3. **Eventos Especiais**
   - Associar turnos a eventos específicos
   - Controle de equipe em eventos

## 📝 Entidade TypeORM

```typescript
@Entity('turnos_funcionario')
export class TurnoFuncionario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'funcionario_id' })
  funcionarioId: string;

  @ManyToOne(() => Funcionario, { eager: true })
  @JoinColumn({ name: 'funcionario_id' })
  funcionario: Funcionario;

  @Column({ type: 'timestamp' })
  checkIn: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkOut: Date;

  @Column({ type: 'int', nullable: true, comment: 'Tempo trabalhado em minutos' })
  horasTrabalhadas: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'evento_id', nullable: true })
  eventoId: string;

  @ManyToOne(() => Evento, { nullable: true, eager: true })
  @JoinColumn({ name: 'evento_id' })
  evento: Evento;

  @CreateDateColumn()
  criadoEm: Date;
}
```

## 🧪 Verificação

### Verificar Tabela Criada
```bash
docker exec pub_system_db psql -U postgres -d pub_system_db -c "\d turnos_funcionario"
```

### Resultado Esperado
```
                                    Table "public.turnos_funcionario"
      Column      |            Type             | Nullable |           Default
------------------+-----------------------------+----------+---------------------------
 id               | uuid                        | not null | uuid_generate_v4()
 funcionario_id   | uuid                        | not null |
 checkIn          | timestamp without time zone | not null |
 checkOut         | timestamp without time zone |          |
 horasTrabalhadas | integer                     |          |
 ativo            | boolean                     | not null | true
 evento_id        | uuid                        |          |
 criadoEm         | timestamp without time zone | not null | now()
Indexes:
    "turnos_funcionario_pkey" PRIMARY KEY, btree (id)
Foreign-key constraints:
    "FK_turno_evento" FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE SET NULL
    "FK_turno_funcionario" FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
```

## 🎯 Teste Manual

### 1. Fazer Check-in
1. Acessar `/garcom` como garçom
2. Clicar em "Fazer Check-in"
3. ✅ Resultado: Check-in realizado com sucesso

### 2. Verificar Turno Ativo
```bash
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT * FROM turnos_funcionario WHERE ativo = true;"
```

### 3. Fazer Check-out
1. Acessar `/garcom` como garçom
2. Clicar em "Fazer Check-out"
3. ✅ Resultado: Check-out realizado, horas calculadas

## 📊 Impacto

### Funcionalidades Desbloqueadas
- ✅ Check-in de funcionários
- ✅ Check-out de funcionários
- ✅ Controle de ponto
- ✅ Relatórios de presença
- ✅ Gestão de turnos em eventos

### Páginas Afetadas
- `/garcom` - Área do Garçom
- `/dashboard/funcionarios` - Gestão de Funcionários
- `/dashboard/eventos` - Gestão de Eventos

## ✨ Conclusão

A tabela `turnos_funcionario` foi criada com sucesso, desbloqueando toda a funcionalidade de controle de ponto e gestão de turnos do sistema.

**Status**: ✅ **CORRIGIDO**

---

**Relacionado**:
- `CORRECAO_EMPRESA_SEEDER.md` - Empresa padrão no seeder
- `CORRECAO_VALIDACAO_MESA.md` - Validação de mesa duplicada
- `CORRECAO_MESAS_TEMPORARIAS.md` - Criação de mesas temporárias
- `RESUMO_SESSAO_FINAL.md` - Resumo da sessão de correções

## 🔄 Próximos Passos

Em ambientes limpos, a migration consolidada criará automaticamente a tabela `turnos_funcionario` junto com todas as outras tabelas do sistema.

Para ambientes existentes que já rodaram as migrations antigas, a tabela será criada na próxima execução da migration consolidada.
