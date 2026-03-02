# 👨‍💻 Guia do Desenvolvedor - Pub System

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- Docker Desktop
- Git
- VSCode (recomendado)

### Setup do Ambiente

```bash
# 1. Clone o repositório
git clone https://github.com/Hopereira/pub-system.git
cd pub-system

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 3. Inicie os containers
docker-compose up -d

# 4. Instale dependências do frontend (desenvolvimento local)
cd frontend && npm install

# 5. Inicie o frontend em modo dev
npm run dev
```

### Acessos de Desenvolvimento
- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Swagger:** http://localhost:3000/api
- **PgAdmin:** http://localhost:8080
- **Login padrão:** admin@admin.com / admin123

---

## 📁 Estrutura do Projeto

```
pub-system/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Autenticação JWT + Passport
│   │   ├── common/         # Interceptors, filters, decorators
│   │   ├── database/       # Migrations e seeders
│   │   ├── modulos/        # 17 módulos de negócio
│   │   └── shared/         # Módulos compartilhados (storage)
│   └── test/               # Testes
├── frontend/               # Next.js 15
│   ├── src/
│   │   ├── app/           # App Router (rotas)
│   │   ├── components/    # Componentes React
│   │   ├── context/       # Contextos (Auth, Turno, etc)
│   │   ├── hooks/         # Hooks customizados
│   │   ├── services/      # Serviços de API
│   │   └── types/         # Tipos TypeScript
│   └── public/            # Assets estáticos
└── docs/                  # Documentação
```

---

## 🔧 Como Adicionar um Novo Módulo

### Backend (NestJS)

```bash
# 1. Gere o módulo via CLI
cd backend
nest g module modulos/novo-modulo
nest g controller modulos/novo-modulo
nest g service modulos/novo-modulo

# 2. Crie a entidade
# backend/src/modulos/novo-modulo/entities/novo-modulo.entity.ts
```

**Estrutura padrão do módulo:**
```
modulos/novo-modulo/
├── dto/
│   ├── create-novo-modulo.dto.ts
│   └── update-novo-modulo.dto.ts
├── entities/
│   └── novo-modulo.entity.ts
├── novo-modulo.controller.ts
├── novo-modulo.service.ts
├── novo-modulo.module.ts
└── novo-modulo.service.spec.ts
```

**Exemplo de Entity:**
```typescript
// entities/novo-modulo.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('novo_modulo')
export class NovoModulo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
```

**Exemplo de DTO:**
```typescript
// dto/create-novo-modulo.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNovoModuloDto {
  @ApiProperty({ description: 'Nome do item' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
```

**Exemplo de Controller:**
```typescript
// novo-modulo.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Cargo } from '../funcionario/entities/funcionario.entity';

@ApiTags('Novo Módulo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('novo-modulo')
export class NovoModuloController {
  constructor(private readonly service: NovoModuloService) {}

  @Post()
  @Roles(Cargo.ADMIN)
  create(@Body() dto: CreateNovoModuloDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
```

### Frontend (Next.js)

**1. Crie o service:**
```typescript
// services/novoModuloService.ts
import api from './api';

export interface NovoModulo {
  id: string;
  nome: string;
  ativo: boolean;
  criadoEm: string;
}

export const getNovoModulos = async (): Promise<NovoModulo[]> => {
  const response = await api.get('/novo-modulo');
  return response.data;
};

export const createNovoModulo = async (data: Partial<NovoModulo>): Promise<NovoModulo> => {
  const response = await api.post('/novo-modulo', data);
  return response.data;
};
```

**2. Crie a página:**
```typescript
// app/(protected)/dashboard/novo-modulo/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getNovoModulos, NovoModulo } from '@/services/novoModuloService';

export default function NovoModuloPage() {
  const [items, setItems] = useState<NovoModulo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getNovoModulos();
      setItems(data);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Novo Módulo</h1>
      {/* Conteúdo */}
    </div>
  );
}
```

---

## 🗄️ Como Criar Migrations

```bash
# 1. Gere a migration
cd backend
npm run typeorm:migration:generate -- src/database/migrations/NomeDaMigration

# 2. Execute a migration
npm run typeorm:migration:run

# 3. Reverter (se necessário)
npm run typeorm:migration:revert
```

**Exemplo de Migration Manual:**
```typescript
// migrations/TIMESTAMP-CreateNovoModuloTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNovoModuloTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'novo_modulo',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'criado_em',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('novo_modulo');
  }
}
```

---

## 📝 Convenções de Nomenclatura

### Backend (NestJS)
| Item | Convenção | Exemplo |
|------|-----------|---------|
| Entidades | PascalCase singular | `Pedido`, `ItemPedido` |
| Tabelas | snake_case plural | `pedidos`, `itens_pedido` |
| Colunas | snake_case | `criado_em`, `empresa_id` |
| DTOs | PascalCase + Dto | `CreatePedidoDto` |
| Services | PascalCase + Service | `PedidoService` |
| Controllers | PascalCase + Controller | `PedidoController` |

### Frontend (Next.js)
| Item | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `PedidoCard.tsx` |
| Páginas | page.tsx | `app/pedidos/page.tsx` |
| Hooks | camelCase + use | `usePedidos.ts` |
| Services | camelCase + Service | `pedidoService.ts` |
| Types | PascalCase | `Pedido`, `ItemPedido` |

### Git
| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Feature | feat: | `feat: adicionar módulo de estoque` |
| Bugfix | fix: | `fix: corrigir cálculo de total` |
| Docs | docs: | `docs: atualizar README` |
| Refactor | refactor: | `refactor: simplificar service` |
| Style | style: | `style: formatar código` |
| Test | test: | `test: adicionar testes unitários` |

---

## 🧪 Testes

### Backend
```bash
# Testes unitários
npm run test

# Testes com watch
npm run test:watch

# Cobertura
npm run test:cov

# E2E
npm run test:e2e
```

### Frontend
```bash
# Testes
npm run test

# Lint
npm run lint
```

---

## 🔒 Autenticação e Autorização

### Roles Disponíveis
- `ADMIN` - Acesso total
- `GERENTE` - Gestão operacional
- `CAIXA` - Área financeira
- `GARCOM` - Pedidos e mesas
- `COZINHA` - Preparo de pedidos

### Proteger Endpoint
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN, Cargo.GERENTE)
@Get('admin-only')
adminOnly() {
  return 'Apenas admin e gerente';
}
```

### Obter Usuário Logado
```typescript
@Get('me')
getProfile(@CurrentUser() user: Funcionario) {
  return user;
}
```

---

## 📚 Recursos Úteis

- **Swagger:** http://localhost:3000/api
- **Documentação NestJS:** https://docs.nestjs.com
- **Documentação Next.js:** https://nextjs.org/docs
- **TypeORM:** https://typeorm.io
- **shadcn/ui:** https://ui.shadcn.com

---

*Última atualização: Dezembro 2025*
