# 📚 API Documentation Gap Analysis - Pub System

**Data:** 17 de Dezembro de 2025  
**Versão:** 1.0  
**Analista:** Cascade AI

---

## 📋 Sumário Executivo

Análise comparativa entre **endpoints documentados no README** e **endpoints realmente existentes no código**, identificando gaps de documentação, exemplos faltantes, tratamento de erros e requisitos de autenticação.

**Total de Endpoints Identificados:** 80+  
**Documentados no README:** ~20 (25%)  
**Gap de Documentação:** ~60 endpoints (75%)

---

## 1. 📊 Visão Geral

### 1.1 Status de Documentação por Módulo

| Módulo | Endpoints | Documentados | Gap | Status |
|--------|-----------|--------------|-----|--------|
| **Auth** | 2 | 2 | 0 | ✅ 100% |
| **Empresa** | 3 | 3 | 0 | ✅ 100% |
| **Mesas** | 6 | 1 | 5 | ❌ 17% |
| **Comandas** | 12 | 3 | 9 | ❌ 25% |
| **Pedidos** | 15 | 2 | 13 | ❌ 13% |
| **Produtos** | 5 | 1 | 4 | ❌ 20% |
| **Caixa** | 8 | 5 | 3 | ⚠️ 63% |
| **Funcionários** | 10 | 0 | 10 | ❌ 0% |
| **Turnos** | 6 | 0 | 6 | ❌ 0% |
| **Analytics** | 5 | 0 | 5 | ❌ 0% |
| **Medalhas** | 3 | 3 | 0 | ✅ 100% |
| **Ambientes** | 4 | 0 | 4 | ❌ 0% |
| **Clientes** | 5 | 0 | 5 | ❌ 0% |
| **Eventos** | 4 | 0 | 4 | ❌ 0% |
| **Páginas Evento** | 4 | 2 | 2 | ⚠️ 50% |
| **Pontos Entrega** | 8 | 0 | 8 | ❌ 0% |
| **Avaliações** | 4 | 0 | 4 | ❌ 0% |

**Resumo:**
- ✅ **Bem Documentados (>80%):** 2 módulos (12%)
- ⚠️ **Parcialmente Documentados (50-80%):** 2 módulos (12%)
- ❌ **Mal Documentados (<50%):** 13 módulos (76%)

---

## 2. 🔍 Endpoints Documentados vs Existentes

### 2.1 Autenticação ✅ (100% Documentado)

| Endpoint | README | Código | Swagger | Status |
|----------|--------|--------|---------|--------|
| `POST /auth/login` | ✅ | ✅ | ✅ | ✅ |
| `GET /auth/profile` | ✅ | ✅ | ✅ | ✅ |

**Exemplos de Request/Response:** ✅ Completos  
**Erros HTTP:** ✅ Documentados (401)  
**Autenticação:** ✅ Especificada

---

### 2.2 Empresa ✅ (100% Documentado)

| Endpoint | README | Código | Swagger | Status |
|----------|--------|--------|---------|--------|
| `GET /empresa` | ✅ | ✅ | ✅ | ✅ |
| `POST /empresa` | ✅ | ✅ | ✅ | ✅ |
| `PATCH /empresa/:id` | ✅ | ✅ | ✅ | ✅ |

**Exemplos de Request/Response:** ✅ Completos  
**Erros HTTP:** ✅ Documentados  
**Autenticação:** ✅ JWT + ADMIN

---

### 2.3 Mesas ❌ (17% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `GET /mesas` | ✅ | ✅ | ✅ | - |
| `GET /mesas/publico` | ❌ | ✅ | ✅ | ❌ |
| `POST /mesas` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /mesas/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /mesas/:id/status` | ❌ | ✅ | ✅ | ❌ |
| `DELETE /mesas/:id` | ❌ | ✅ | ✅ | ❌ |

**Faltando:**
- ❌ Exemplos de request/response para CRUD
- ❌ Documentação de status possíveis (LIVRE, OCUPADA, RESERVADA)
- ❌ Endpoint público `/mesas/publico`

---

### 2.4 Comandas ❌ (25% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `POST /comandas` | ✅ | ✅ | ✅ | - |
| `GET /comandas/:id` | ✅ | ✅ | ✅ | - |
| `GET /comandas/:id/public` | ✅ | ✅ | ✅ | - |
| `GET /comandas` | ❌ | ✅ | ✅ | ❌ |
| `GET /comandas/search` | ❌ | ✅ | ✅ | ❌ |
| `GET /comandas/recuperar` | ❌ | ✅ | ✅ | ❌ |
| `GET /comandas/mesa/:mesaId/aberta` | ❌ | ✅ | ✅ | ❌ |
| `GET /comandas/abertas` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /comandas/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /comandas/:id/fechar` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /comandas/:id/ponto-entrega` | ❌ | ✅ | ✅ | ❌ |
| `DELETE /comandas/:id` | ❌ | ✅ | ✅ | ❌ |

**Faltando:**
- ❌ Endpoint `/comandas/recuperar` (público, busca por CPF)
- ❌ Endpoint `/comandas/search` (busca por termo)
- ❌ Endpoint `/comandas/abertas` (lista comandas abertas)
- ❌ Processo de fechamento de comanda
- ❌ Exemplos de request/response

---

### 2.5 Pedidos ❌ (13% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `POST /pedidos` | ✅ | ✅ | ✅ | - |
| `PUT /pedidos/:id/status` | ✅ | ✅ | ⚠️ | ⚠️ PATCH, não PUT |
| `POST /pedidos/cliente` | ❌ | ✅ | ✅ | ❌ |
| `POST /pedidos/garcom` | ❌ | ✅ | ✅ | ❌ |
| `GET /pedidos` | ❌ | ✅ | ✅ | ❌ |
| `GET /pedidos/prontos` | ❌ | ✅ | ✅ | ❌ |
| `GET /pedidos/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /pedidos/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /pedidos/item/:id/status` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /pedidos/item/:id/retirar` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /pedidos/item/:id/deixar-no-ambiente` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /pedidos/item/:id/marcar-entregue` | ❌ | ✅ | ✅ | ❌ |
| `DELETE /pedidos/:id` | ❌ | ✅ | ✅ | ❌ |
| `GET /pedidos/analytics/*` | ❌ | ✅ | ✅ | ❌ |

**Faltando:**
- ❌ Fluxo completo de pedido (cliente vs garçom)
- ❌ Status de itens individuais
- ❌ Rastreamento (quem criou, quem entregou)
- ❌ Endpoints de analytics de pedidos
- ❌ Exemplos de request/response

---

### 2.6 Produtos ❌ (20% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `POST /produtos` | ✅ | ✅ | ✅ | - |
| `GET /produtos` | ❌ | ✅ | ✅ | ❌ |
| `GET /produtos/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /produtos/:id` | ❌ | ✅ | ✅ | ❌ |
| `DELETE /produtos/:id` | ❌ | ✅ | ✅ | ❌ |

**Faltando:**
- ❌ Upload de imagens (multipart/form-data)
- ❌ Exemplos de request com imagem
- ❌ Integração com Google Cloud Storage

---

### 2.7 Caixa ⚠️ (63% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `POST /caixa/abertura` | ✅ | ✅ | ✅ | - |
| `POST /caixa/fechamento` | ✅ | ✅ | ✅ | - |
| `POST /caixa/sangria` | ✅ | ✅ | ✅ | - |
| `POST /caixa/suprimento` | ✅ | ✅ | ✅ | - |
| `GET /caixa/resumo/:id` | ✅ | ✅ | ✅ | - |
| `POST /caixa/venda` | ❌ | ✅ | ✅ | ❌ |
| `GET /caixa/fechamentos` | ❌ | ✅ | ✅ | ❌ |
| `GET /caixa/relatorio-vendas` | ❌ | ✅ | ✅ | ❌ |

**Faltando:**
- ❌ Endpoint `/caixa/venda` (registro de venda)
- ❌ Endpoint `/caixa/fechamentos` (histórico)
- ❌ Endpoint `/caixa/relatorio-vendas` (relatório)

---

### 2.8 Funcionários ❌ (0% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `GET /funcionarios/check-first-access` | ❌ | ✅ | ✅ | ❌ |
| `POST /funcionarios/registro` | ❌ | ✅ | ✅ | ❌ |
| `POST /funcionarios` | ❌ | ✅ | ✅ | ❌ |
| `GET /funcionarios` | ❌ | ✅ | ✅ | ❌ |
| `GET /funcionarios/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /funcionarios/:id` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /funcionarios/:id/senha` | ❌ | ✅ | ✅ | ❌ |
| `PATCH /funcionarios/:id/upload` | ❌ | ✅ | ✅ | ❌ |
| `DELETE /funcionarios/:id` | ❌ | ✅ | ✅ | ❌ |
| `GET /funcionarios/:id/turnos` | ❌ | ✅ | ✅ | ❌ |

**Totalmente não documentado no README.**

---

### 2.9 Turnos ❌ (0% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `POST /turnos/check-in` | ❌ | ✅ | ✅ | ❌ |
| `POST /turnos/check-out` | ❌ | ✅ | ✅ | ❌ |
| `GET /turnos/ativos` | ❌ | ✅ | ✅ | ❌ |
| `GET /turnos/funcionario/:id` | ❌ | ✅ | ✅ | ❌ |
| `GET /turnos/funcionario/:id/estatisticas` | ❌ | ✅ | ✅ | ❌ |
| `GET /turnos/funcionario/:id/ativo` | ❌ | ✅ | ✅ | ❌ |

**Totalmente não documentado no README.**

---

### 2.10 Analytics ❌ (0% Documentado)

| Endpoint | README | Código | Swagger | Gap |
|----------|--------|--------|---------|-----|
| `GET /analytics/geral` | ❌ | ✅ | ✅ | ❌ |
| `GET /analytics/garcons` | ❌ | ✅ | ✅ | ❌ |
| `GET /analytics/ambientes` | ❌ | ✅ | ✅ | ❌ |
| `GET /pedidos/analytics/produtos-mais-vendidos` | ❌ | ✅ | ✅ | ❌ |
| `GET /pedidos/analytics/produtos-menos-vendidos` | ❌ | ✅ | ✅ | ❌ |

**Totalmente não documentado no README.**

---

### 2.11 Medalhas ✅ (100% Documentado)

| Endpoint | README | Código | Swagger | Status |
|----------|--------|--------|---------|--------|
| `GET /medalhas/garcom/:id` | ✅ | ✅ | ✅ | ✅ |
| `GET /medalhas/garcom/:id/progresso` | ✅ | ✅ | ✅ | ✅ |
| `GET /medalhas/garcom/:id/verificar` | ✅ | ✅ | ✅ | ✅ |

**Exemplos de Request/Response:** ⚠️ Faltando  
**Erros HTTP:** ⚠️ Faltando

---

### 2.12 Outros Módulos Não Documentados

**Ambientes:** 4 endpoints (0% documentado)  
**Clientes:** 5 endpoints (0% documentado)  
**Eventos:** 4 endpoints (0% documentado)  
**Páginas Evento:** 4 endpoints (50% documentado)  
**Pontos Entrega:** 8 endpoints (0% documentado)  
**Avaliações:** 4 endpoints (0% documentado)

---

## 3. 📝 Exemplos de Request/Response Faltando

### 3.1 Endpoints com Exemplos Completos ✅

1. **POST /auth/login**
   ```json
   // Request
   {
     "email": "admin@admin.com",
     "senha": "admin123"
   }
   
   // Response 200
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "funcionario": {
       "id": "uuid",
       "nome": "Admin",
       "email": "admin@admin.com",
       "cargo": "ADMIN"
     }
   }
   ```

### 3.2 Endpoints sem Exemplos ❌

**Faltam exemplos para 60+ endpoints**, incluindo:

1. **POST /pedidos**
   - ❌ Exemplo de request com múltiplos itens
   - ❌ Exemplo de response com relações completas
   - ❌ Exemplo de erro (comanda não encontrada)

2. **PATCH /comandas/:id/fechar**
   - ❌ Exemplo de request com forma de pagamento
   - ❌ Exemplo de response com cálculo de totais
   - ❌ Exemplo de erro (valor insuficiente)

3. **POST /caixa/fechamento**
   - ❌ Exemplo de request com valores informados
   - ❌ Exemplo de response com diferenças calculadas
   - ❌ Exemplo de erro (caixa não aberto)

4. **GET /analytics/geral**
   - ❌ Exemplo de query params (dataInicio, dataFim)
   - ❌ Exemplo de response com métricas
   - ❌ Estrutura de dados retornada

5. **POST /funcionarios**
   - ❌ Exemplo de request com todos os campos
   - ❌ Exemplo de response
   - ❌ Exemplo de erro (email duplicado)

---

## 4. ⚠️ Erros HTTP e Tratamentos

### 4.1 Códigos HTTP Documentados

| Código | Descrição | Documentação | Status |
|--------|-----------|--------------|--------|
| 200 | OK | ✅ Sim | ✅ |
| 201 | Created | ✅ Sim | ✅ |
| 400 | Bad Request | ✅ Sim | ✅ |
| 401 | Unauthorized | ✅ Sim | ✅ |
| 403 | Forbidden | ✅ Sim | ✅ |
| 404 | Not Found | ✅ Sim | ✅ |
| 500 | Internal Server Error | ✅ Sim | ✅ |

### 4.2 Tratamentos de Erro Implementados

**AllExceptionsFilter (Global):**
```typescript
// Captura todas exceções
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log diferenciado por tipo
    // Resposta padronizada JSON
  }
}
```

**Formato de Resposta de Erro:**
```json
{
  "statusCode": 400,
  "timestamp": "2025-12-17T15:00:00Z",
  "path": "/pedidos",
  "method": "POST",
  "message": "Descrição do erro",
  "errors": { /* detalhes */ }
}
```

### 4.3 Erros Específicos por Endpoint (Faltando)

**Exemplos de erros não documentados:**

1. **POST /pedidos**
   - ❌ 404: Comanda não encontrada
   - ❌ 404: Produto não encontrado
   - ❌ 400: Comanda não está aberta
   - ❌ 400: Pedido sem itens

2. **PATCH /comandas/:id/fechar**
   - ❌ 404: Comanda não encontrada
   - ❌ 400: Comanda já fechada
   - ❌ 400: Valor pago insuficiente
   - ❌ 400: Pedidos em preparo

3. **POST /caixa/abertura**
   - ❌ 404: Turno não encontrado
   - ❌ 400: Turno não está ativo
   - ❌ 400: Caixa já aberto para este turno

---

## 5. 🔐 Autenticação por Endpoint

### 5.1 Endpoints Públicos (Sem Autenticação)

| Endpoint | Método | Decorator | Uso |
|----------|--------|-----------|-----|
| `/auth/login` | POST | - | Login |
| `/comandas` | POST | `@Public()` | Cliente criar comanda |
| `/comandas/recuperar` | GET | `@Public()` | Recuperar por CPF |
| `/comandas/:id/public` | GET | `@Public()` | QR Code |
| `/pedidos/cliente` | POST | `@Public()` | Cliente fazer pedido |
| `/produtos` | GET | `@Public()` | Cardápio público |
| `/mesas/publico` | GET | `@Public()` | Mesas públicas |
| `/ambientes/publico` | GET | `@Public()` | Ambientes públicos |
| `/pontos-entrega/publicos/ativos` | GET | `@Public()` | Pontos públicos |
| `/funcionarios/check-first-access` | GET | - | Primeiro acesso |
| `/funcionarios/registro` | POST | - | Registro inicial |
| `/evento/:slug` | GET | `@Public()` | Landing page |

**Total:** 12 endpoints públicos

### 5.2 Endpoints Protegidos por Role

| Role | Endpoints | Exemplo |
|------|-----------|---------|
| **ADMIN** | ~50 | CRUD de funcionários, produtos, mesas |
| **GERENTE** | ~30 | Operacional, relatórios |
| **CAIXA** | ~20 | Caixa, comandas, fechamento |
| **GARCOM** | ~25 | Pedidos, comandas, mesas |
| **COZINHA** | ~10 | Pedidos, status de itens |

### 5.3 Mapeamento Completo de Autenticação

**Formato:**
```
[Método] [Endpoint] - [Roles] - [Autenticação]
```

#### Auth
- `POST /auth/login` - **Público** - Nenhuma
- `GET /auth/profile` - **Autenticado** - JWT

#### Empresa
- `GET /empresa` - **ADMIN, GERENTE** - JWT + RolesGuard
- `POST /empresa` - **ADMIN** - JWT + RolesGuard
- `PATCH /empresa/:id` - **ADMIN** - JWT + RolesGuard

#### Mesas
- `GET /mesas` - **ADMIN, GERENTE, GARCOM** - JWT + RolesGuard
- `GET /mesas/publico` - **Público** - Nenhuma
- `POST /mesas` - **ADMIN** - JWT + RolesGuard
- `PATCH /mesas/:id` - **ADMIN** - JWT + RolesGuard
- `PATCH /mesas/:id/status` - **ADMIN, GARCOM** - JWT + RolesGuard
- `DELETE /mesas/:id` - **ADMIN** - JWT + RolesGuard

#### Comandas
- `POST /comandas` - **Público** - Nenhuma
- `GET /comandas` - **ADMIN, GARCOM, CAIXA** - JWT + RolesGuard
- `GET /comandas/recuperar` - **Público** - Nenhuma
- `GET /comandas/:id/public` - **Público** - Nenhuma
- `GET /comandas/search` - **ADMIN, CAIXA** - JWT + RolesGuard
- `PATCH /comandas/:id/fechar` - **ADMIN, CAIXA** - JWT + RolesGuard
- `DELETE /comandas/:id` - **ADMIN** - JWT + RolesGuard

#### Pedidos
- `POST /pedidos` - **ADMIN, GARCOM** - JWT + RolesGuard
- `POST /pedidos/cliente` - **Público** - Nenhuma
- `POST /pedidos/garcom` - **ADMIN, GARCOM** - JWT + RolesGuard
- `GET /pedidos` - **ADMIN, GARCOM, CAIXA, COZINHA** - JWT + RolesGuard
- `PATCH /pedidos/item/:id/status` - **ADMIN, COZINHA, GARCOM** - JWT + RolesGuard
- `PATCH /pedidos/item/:id/marcar-entregue` - **ADMIN, GARCOM** - JWT + RolesGuard
- `DELETE /pedidos/:id` - **ADMIN** - JWT + RolesGuard

#### Produtos
- `GET /produtos` - **Público** - Nenhuma
- `POST /produtos` - **ADMIN** - JWT + RolesGuard
- `PATCH /produtos/:id` - **ADMIN** - JWT + RolesGuard
- `DELETE /produtos/:id` - **ADMIN** - JWT + RolesGuard

#### Caixa
- **TODOS** - **ADMIN, CAIXA** - JWT + RolesGuard

#### Funcionários
- `GET /funcionarios/check-first-access` - **Público** - Nenhuma
- `POST /funcionarios/registro` - **Público** - Nenhuma
- **TODOS OUTROS** - **ADMIN** - JWT + RolesGuard

#### Turnos
- `POST /turnos/check-in` - **ADMIN, GARCOM, COZINHA, CAIXA** - JWT + RolesGuard
- `POST /turnos/check-out` - **ADMIN, GARCOM, COZINHA, CAIXA** - JWT + RolesGuard
- `GET /turnos/ativos` - **ADMIN, CAIXA** - JWT + RolesGuard
- `GET /turnos/funcionario/:id/*` - **Autenticado** - JWT

#### Analytics
- **TODOS** - **ADMIN, GERENTE** - JWT + RolesGuard

---

## 6. 📋 Recomendações

### 6.1 Prioridade CRÍTICA 🔴

1. **Documentar Endpoints Principais**
   - Pedidos (15 endpoints)
   - Comandas (12 endpoints)
   - Funcionários (10 endpoints)
   - Turnos (6 endpoints)

2. **Adicionar Exemplos de Request/Response**
   - Todos os endpoints CRUD
   - Operações críticas (pedido, pagamento)
   - Erros comuns

3. **Documentar Erros HTTP**
   - Códigos por endpoint
   - Mensagens de erro
   - Casos de uso

### 6.2 Prioridade ALTA 🟡

4. **Documentar Autenticação**
   - Tabela completa de roles por endpoint
   - Exemplos de headers
   - Fluxo de autenticação

5. **Documentar Endpoints Públicos**
   - Lista completa
   - Casos de uso
   - Limitações

6. **Documentar Analytics**
   - Estrutura de dados
   - Filtros disponíveis
   - Exemplos de queries

### 6.3 Prioridade MÉDIA 🟢

7. **Documentar Upload de Arquivos**
   - Multipart/form-data
   - Limites de tamanho
   - Formatos aceitos

8. **Documentar WebSocket**
   - Eventos disponíveis
   - Payload de cada evento
   - Como conectar

9. **Criar Postman Collection**
   - Todos os endpoints
   - Exemplos de uso
   - Variáveis de ambiente

---

## 7. 📊 Resumo de Gaps

### 7.1 Por Tipo de Gap

| Tipo de Gap | Quantidade | Percentual |
|-------------|------------|------------|
| Endpoints não documentados | 60+ | 75% |
| Exemplos de request/response faltando | 70+ | 87% |
| Erros HTTP não documentados | 80+ | 100% |
| Autenticação não especificada | 50+ | 62% |

### 7.2 Esforço Estimado para Correção

| Tarefa | Esforço | Prioridade |
|--------|---------|------------|
| Documentar endpoints principais | 16h | 🔴 CRÍTICA |
| Adicionar exemplos | 24h | 🔴 CRÍTICA |
| Documentar erros | 16h | 🟡 ALTA |
| Documentar autenticação | 8h | 🟡 ALTA |
| Criar Postman collection | 8h | 🟢 MÉDIA |
| **TOTAL** | **72h** | - |

---

## 8. 🎯 Plano de Ação

### Sprint 1 (2 semanas)
- [ ] Documentar 20 endpoints principais
- [ ] Adicionar 30 exemplos de request/response
- [ ] Documentar erros críticos

### Sprint 2 (2 semanas)
- [ ] Documentar 40 endpoints restantes
- [ ] Adicionar 40 exemplos restantes
- [ ] Documentar todos os erros

### Sprint 3 (1 semana)
- [ ] Documentar autenticação completa
- [ ] Criar Postman collection
- [ ] Revisar documentação

---

*Documento gerado em 17/12/2025*
