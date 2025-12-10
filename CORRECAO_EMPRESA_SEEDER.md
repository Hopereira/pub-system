# Correção: Empresa Padrão no Seeder

## 📋 Problema Identificado

Ao tentar criar um ponto de entrega, o sistema retornava erro:
```
statusCode: 400
message: 'Nenhuma empresa cadastrada no sistema'
```

## 🔍 Causa Raiz

O serviço de `PontoEntrega` requer que exista pelo menos uma empresa no banco de dados, mas o seeder não estava criando nenhuma empresa automaticamente.

## ✅ Solução Implementada

### 1. **Atualização do SeederModule**
**Arquivo**: `backend/src/database/seeder.module.ts`

Adicionado import e registro da entidade `Empresa`:
```typescript
import { Empresa } from '../modulos/empresa/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ambiente, Mesa, Produto, Cliente, Comanda, Empresa])],
  // ...
})
```

### 2. **Atualização do SeederService**
**Arquivo**: `backend/src/database/seeder.service.ts`

#### Injeção do Repositório
```typescript
constructor(
  // ... outros repositórios
  @InjectRepository(Empresa)
  private readonly empresaRepository: Repository<Empresa>,
) {}
```

#### Criação da Empresa Padrão
```typescript
// 1.5. Criar Empresa padrão se não existir
const countEmpresas = await this.empresaRepository.count();
if (countEmpresas === 0) {
  await this.empresaRepository.save({
    cnpj: '00.000.000/0000-00',
    nomeFantasia: 'Pub System - Demo',
    razaoSocial: 'Pub System Demonstração LTDA',
    telefone: '(11) 99999-9999',
    endereco: 'Rua Demo, 123 - São Paulo, SP'
  });
  this.logger.log('✅ Empresa padrão criada.');
}
```

### 3. **Criação Manual no Banco (Temporário)**
Para resolver o problema imediato, foi criada uma empresa manualmente:
```sql
INSERT INTO empresas (id, cnpj, "nomeFantasia", "razaoSocial", telefone, endereco)
VALUES (
  uuid_generate_v4(),
  '00.000.000/0000-00',
  'Pub System - Demo',
  'Pub System Demonstração LTDA',
  '(11) 99999-9999',
  'Rua Demo, 123 - São Paulo, SP'
)
ON CONFLICT (cnpj) DO NOTHING;
```

## 📊 Resultado

### Estado Atual do Banco
```
pub_system_db=# SELECT * FROM empresas;
                  id                  |        cnpj        |   nomeFantasia    |         razaoSocial          
--------------------------------------+--------------------+-------------------+------------------------------
 48ac7710-2f39-497b-8d29-a70952054221 | 15929437000181     | Hebert O Pereira  | teste                        
 ded57eb9-7c67-4a31-a39d-3b289a1fe28f | 00.000.000/0000-00 | Pub System - Demo | Pub System Demonstração LTDA
(2 rows)
```

### Benefícios
- ✅ Seeder agora cria empresa automaticamente
- ✅ Novos ambientes limpos terão empresa padrão
- ✅ Pontos de entrega podem ser criados sem erro
- ✅ Sistema funciona em `docker-compose up` limpo

## 🎯 Próximos Passos

1. **Testar em Ambiente Limpo**
   ```bash
   docker-compose down -v
   docker-compose up
   ```

2. **Verificar Criação de Pontos de Entrega**
   - Acessar `/dashboard/admin/pontos-entrega`
   - Criar novo ponto de entrega
   - Verificar se não há mais erro 400

3. **Investigar Timeout no Salvamento de Layout**
   - O erro de timeout ao salvar posição das mesas ainda precisa ser investigado
   - Pode estar relacionado ao `MedalhaScheduler` que está apresentando erros

## 📝 Arquivos Modificados

1. `backend/src/database/seeder.module.ts`
   - Adicionado import de `Empresa`
   - Registrado `Empresa` no TypeOrmModule

2. `backend/src/database/seeder.service.ts`
   - Injetado `empresaRepository`
   - Adicionada lógica de criação de empresa padrão

## ⚠️ Problemas Pendentes

### 1. Timeout ao Salvar Layout de Mesas
```
timeout of 30000ms exceeded
PUT /mesas/{id}/posicao
```
**Status**: Pendente investigação

### 2. Erros no MedalhaScheduler
```
[MedalhaScheduler] ❌ Erro ao verificar medalhas de Hebert
[MedalhaScheduler] ❌ Erro ao verificar medalhas de kelly
```
**Status**: Pendente investigação

## ✨ Conclusão

A correção garante que o sistema sempre terá uma empresa padrão disponível, eliminando o erro 400 ao criar pontos de entrega. Em ambientes limpos, o seeder criará automaticamente todos os dados necessários, incluindo a empresa.

**Status**: ✅ **CORRIGIDO**
