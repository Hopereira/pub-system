# 📊 Relatório de Prontidão para Venda - Pub System

**Data da Análise:** 18 de novembro de 2025  
**Versão:** 1.0.0  
**Status Geral:** ⚠️ **85% Pronto - Necessita Ajustes Críticos**

---

## 🎯 RESUMO EXECUTIVO

### Status por Módulo
| Módulo | Completude | Status | Crítico |
|--------|-----------|--------|---------|
| 🏢 Gestão Básica | 100% | ✅ Pronto | Não |
| 🍽️ Cardápio & Produtos | 100% | ✅ Pronto | Não |
| 🎯 Operacional (Pedidos) | 95% | ✅ Pronto | Não |
| 💰 Pagamentos | 0% | ❌ Ausente | **SIM** |
| 📊 Relatórios/Analytics | 30% | ⚠️ Incompleto | **SIM** |
| 🏆 Gamificação | 90% | ✅ Funcional | Não |
| 🔔 Notificações | 100% | ✅ Pronto | Não |
| 🔐 Segurança | 87% | ⚠️ Melhorias | Sim |
| 📱 UX/UI | 85% | ⚠️ Melhorias | Não |
| 🧪 Testes | 40% | ⚠️ Incompleto | Sim |
| 📚 Documentação | 95% | ✅ Excelente | Não |

### Pontuação Geral
- **Funcionalidades Core:** 87/100 ✅
- **Funcionalidades Críticas:** 65/100 ⚠️
- **Estabilidade:** 82/100 ⚠️
- **Segurança:** 78/100 ⚠️
- **Pronto para Venda:** **70/100** ⚠️

---

## 🔴 BLOQUEADORES CRÍTICOS PARA VENDA

### 1. ❌ SISTEMA DE PAGAMENTOS AUSENTE
**Impacto:** 🔴 **BLOQUEADOR TOTAL**

**Situação Atual:**
- ✅ Comanda fecha (muda status para FECHADA)
- ✅ Mesa é liberada
- ❌ **NÃO HÁ PROCESSAMENTO DE PAGAMENTO**
- ❌ Sem integração com gateway
- ❌ Sem registro de forma de pagamento
- ❌ Sem controle de caixa/fechamento

**O que falta:**
```typescript
// BACKEND - Módulo ausente
backend/src/modulos/pagamento/
  ├── entities/
  │   ├── pagamento.entity.ts        // ❌ NÃO EXISTE
  │   └── forma-pagamento.entity.ts  // ❌ NÃO EXISTE
  ├── dto/
  │   └── processar-pagamento.dto.ts // ❌ NÃO EXISTE
  ├── pagamento.service.ts           // ❌ NÃO EXISTE
  └── pagamento.controller.ts        // ❌ NÃO EXISTE

// ENTIDADES NECESSÁRIAS
- Pagamento (valor, data, forma, status)
- FormaPagamento (DINHEIRO, CARTAO, PIX, VALE)
- MovimentoCaixa (abertura, fechamento, saldo)
```

**Funcionalidades Ausentes:**
- [ ] Registrar pagamento por forma
- [ ] Pagamento parcial/divisão de conta
- [ ] Integração PIX
- [ ] Integração cartão (Stone, Rede, Cielo)
- [ ] Controle de caixa (abertura/fechamento)
- [ ] Sangria e reforço
- [ ] Fechamento diário/mensal
- [ ] Conciliação bancária
- [ ] Emissão de comprovantes
- [ ] Notas fiscais (NFe/NFCe)

**Tempo Estimado:** 2-3 semanas  
**Prioridade:** 🔴 **URGENTE**

---

### 2. ⚠️ SISTEMA DE RELATÓRIOS INCOMPLETO
**Impacto:** 🟠 **CRITICO para GESTÃO**

**Situação Atual:**
- ✅ Analytics básico de pedidos existe
- ✅ Ranking de garçons (90% pronto)
- ⚠️ Relatórios financeiros ausentes
- ⚠️ Dashboards de gestão limitados

**O que existe:**
```typescript
// ✅ Implementado
backend/src/modulos/pedido/pedido-analytics.service.ts
- getTaxaOcupacao()
- getTempoMedioPreparo()
- getProdutosMaisVendidos()
- getTicketMedio()

// ✅ Implementado (Issue #3)
backend/src/modulos/analytics/
- Ranking de garçons
- Medalhas e gamificação
- Tempo de entrega
```

**O que falta:**
- [ ] Relatório de vendas por período
- [ ] Relatório de vendas por produto/categoria
- [ ] Relatório de desperdício/cancelamentos
- [ ] Relatório de desempenho de garçons
- [ ] Relatório de turnos e presença
- [ ] Análise de custos (CMV)
- [ ] Projeção de vendas
- [ ] Análise de margem de lucro
- [ ] Relatório de estoque
- [ ] Dashboards executivos
- [ ] Exportação PDF/Excel
- [ ] Gráficos comparativos

**Dashboards Ausentes:**
```typescript
// FRONTEND - Páginas faltantes
frontend/src/app/(protected)/dashboard/relatorios/
  ├── vendas/                // ❌ NÃO EXISTE
  ├── financeiro/            // ❌ NÃO EXISTE
  ├── produtos/              // ❌ NÃO EXISTE
  ├── funcionarios/          // ❌ NÃO EXISTE
  └── executivo/             // ❌ NÃO EXISTE
```

**Tempo Estimado:** 2-3 semanas  
**Prioridade:** 🟠 **ALTA**

---

### 3. ⚠️ TESTES AUTOMATIZADOS INSUFICIENTES
**Impacto:** 🟠 **RISCO de BUGS em PRODUÇÃO**

**Situação Atual:**
```bash
# Backend
npm run test        # ❌ Muitos testes faltando
npm run test:e2e    # ❌ Não implementado
npm run test:cov    # ⚠️ Cobertura ~40%

# Frontend
npm run test        # ❌ Não configurado
```

**O que falta:**
- [ ] Testes unitários (backend): ~60%
- [ ] Testes de integração: ~80%
- [ ] Testes E2E: ~95%
- [ ] Testes de carga: 100%
- [ ] Testes de segurança: 100%

**Módulos sem testes:**
- `pagamento.service.ts` (não existe)
- `comanda.service.ts` (race condition testado?)
- `pedido.service.ts` (cálculos testados?)
- Todos os controllers (autorização?)
- WebSocket (conexões simultâneas?)

**Tempo Estimado:** 2 semanas  
**Prioridade:** 🟠 **ALTA**

---

## 🟡 PROBLEMAS MÉDIOS - IMPEDEM VENDA PROFISSIONAL

### 4. CONTROLE DE ESTOQUE AUSENTE
**Impacto:** 🟡 **IMPORTANTE**

**Situação:**
- ✅ Produtos cadastrados
- ❌ Sem controle de quantidade
- ❌ Sem baixa automática ao vender
- ❌ Sem alerta de estoque mínimo
- ❌ Sem histórico de movimentação

**Funcionalidades Necessárias:**
```typescript
// backend/src/modulos/estoque/ (NÃO EXISTE)
- Quantidade atual por produto
- Movimentação (entrada/saída)
- Inventário
- Alerta de estoque baixo
- Relatório de giro
- Integração com fornecedores
```

---

### 5. BACKUP E RECUPERAÇÃO
**Impacto:** 🟡 **RISCO de PERDA DE DADOS**

**Situação:**
- ❌ Sem rotina de backup automático
- ❌ Sem procedimento de recuperação documentado
- ❌ Sem redundância de banco
- ❌ Sem versionamento de dados críticos

**Necessário:**
```bash
# Scripts de backup
scripts/backup/
  ├── backup-diario.sh
  ├── backup-semanal.sh
  └── restore.sh

# Configuração
- Backup automático PostgreSQL
- Retenção: 7 dias (diário), 4 semanas (semanal)
- Teste de restore mensal
```

---

### 6. PERMISSÕES E AUDITORIA
**Impacto:** 🟡 **SEGURANÇA e COMPLIANCE**

**Situação:**
- ✅ Sistema de roles básico (ADMIN, GARCOM, COZINHA, CAIXA)
- ⚠️ Permissões em nível de rota
- ❌ Sem log de auditoria
- ❌ Sem rastreamento de alterações
- ❌ Sem controle fino de permissões

**Melhorias Necessárias:**
```typescript
// Auditoria
backend/src/modulos/auditoria/
- Log de todas as operações críticas
- Quem fez, quando, o quê
- Retenção de 90 dias
- Exportação para análise

// Permissões Granulares
- Permissão por endpoint
- Permissão por campo
- Permissão por horário
- Permissão por localização (mesa/ambiente)
```

---

### 7. CONFIGURAÇÕES DO ESTABELECIMENTO
**Impacto:** 🟡 **FLEXIBILIDADE**

**Situação Atual:**
- ✅ Cadastro de empresa
- ✅ Ambientes de preparo
- ⚠️ Configurações limitadas

**Configurações Ausentes:**
```typescript
// Necessário
- Taxa de serviço (10%, 12.5%, opcional)
- Couvert artístico
- Horário de funcionamento
- Tempo máximo de preparo por ambiente
- Tempo de permanência na mesa
- Política de cancelamento
- Regras de desconto
- Programa de fidelidade
- Integração com delivery
```

---

## 🟢 PONTOS FORTES DO SISTEMA

### ✅ Funcionalidades Bem Implementadas

#### 1. **Gestão Operacional (95%)**
- ✅ Mesas (CRUD completo, mapa visual, drag-and-drop)
- ✅ Comandas (abrir, adicionar itens, fechar)
- ✅ Pedidos (criar, acompanhar, atualizar status)
- ✅ Ambientes de preparo dinâmicos
- ✅ Pontos de entrega
- ✅ Fluxo cliente → caixa → cozinha → garçom
- ✅ Check-in/Check-out de garçons

#### 2. **Sistema de Notificações (100%)**
- ✅ WebSocket em tempo real
- ✅ Notificação sonora por ambiente
- ✅ Eventos segregados (novo_pedido, pronto, etc)
- ✅ Reconexão automática
- ✅ Fallback para polling

#### 3. **Interface do Cliente (100%)**
- ✅ QR Code para acompanhamento
- ✅ Visualização pública da comanda
- ✅ Landing pages de eventos
- ✅ Criação rápida de cliente

#### 4. **Arquitetura (95%)**
- ✅ Backend NestJS modular
- ✅ Frontend Next.js 15 (App Router)
- ✅ TypeORM com migrations
- ✅ Docker/Docker Compose
- ✅ Variáveis de ambiente
- ✅ Logger estruturado
- ✅ Validações (class-validator, Zod)

#### 5. **Documentação (95%)**
- ✅ 74 documentos técnicos
- ✅ README completo
- ✅ Guias de setup
- ✅ Diagramas de fluxo
- ✅ Documentação de issues

---

## 👥 ANÁLISE POR PERFIL DE USUÁRIO

### 👔 ADMINISTRADOR

#### ✅ O que funciona bem:
- Cadastro de produtos, mesas, funcionários
- Configuração de ambientes
- Visualização de pedidos em tempo real
- Mapa visual do estabelecimento
- Controle de turnos

#### ❌ O que falta (CRÍTICO):
- **Relatórios financeiros**
- **Fechamento de caixa**
- **Controle de estoque**
- **Dashboard executivo**
- **Análise de custos/lucros**
- **Gestão de fornecedores**
- **Notas fiscais**

#### ⚠️ O que falta (IMPORTANTE):
- Análise de desempenho
- Metas e indicadores
- Configuração de horários
- Política de descontos
- Programa de fidelidade

---

### 🍽️ GARÇOM

#### ✅ O que funciona bem:
- Check-in/Check-out de turno
- Visualização de mesas no mapa
- Criar pedido para cliente
- Ver pedidos prontos
- Retirar itens para entrega
- Deixar item no ambiente
- Sistema de medalhas (gamificação)

#### ❌ O que falta (CRÍTICO):
- Nenhum bloqueador crítico

#### ⚠️ O que falta (IMPORTANTE):
- Histórico de entregas do dia
- Ranking em tempo real
- Notificação de medalha conquistada
- Comissão calculada
- Feedback de clientes

---

### 🔪 COZINHA

#### ✅ O que funciona bem:
- Visualização de pedidos por ambiente
- Notificação sonora de novo pedido
- Atualização de status
- Filtro por ambiente
- Integração WebSocket

#### ❌ O que falta (CRÍTICO):
- Nenhum bloqueador crítico

#### ⚠️ O que falta (IMPORTANTE):
- Fila de prioridade
- Tempo estimado de preparo
- Alerta de pedido atrasado
- Histórico de preparos
- Estatísticas de desempenho

---

### 💰 CAIXA

#### ✅ O que funciona bem:
- Buscar comandas abertas
- Visualizar total da comanda
- Fechar comanda

#### ❌ O que falta (CRÍTICO):
- **Processar pagamento**
- **Selecionar forma de pagamento**
- **Divisão de conta**
- **Desconto**
- **Emitir comprovante**
- **Abertura/fechamento de caixa**

#### ⚠️ O que falta (IMPORTANTE):
- Histórico de vendas do dia
- Metas de vendas
- Alertas de divergência

---

### 👤 CLIENTE

#### ✅ O que funciona bem:
- Escanear QR Code
- Ver itens da comanda
- Acompanhar status dos pedidos
- Fazer pedidos (se habilitado)
- Avaliar atendimento

#### ❌ O que falta (CRÍTICO):
- Nenhum bloqueador crítico

#### ⚠️ O que falta (IMPORTANTE):
- Pagamento via app (PIX)
- Dividir conta
- Programa de fidelidade
- Histórico de visitas
- Reserva de mesa

---

### 📊 GESTOR DO SISTEMA

#### ✅ O que funciona bem:
- Documentação técnica excelente
- Arquitetura modular
- Setup automatizado
- Logs estruturados
- Migrations versionadas

#### ❌ O que falta (CRÍTICO):
- **Monitoramento em produção**
- **Alertas de erro**
- **Métricas de performance**
- **Plano de disaster recovery**

#### ⚠️ O que falta (IMPORTANTE):
- CI/CD pipeline
- Testes automatizados completos
- Versionamento semântico
- Changelog automatizado
- Health checks completos

---

## 🔒 ANÁLISE DE SEGURANÇA

### ✅ Implementado (87%)

1. **Autenticação**
   - ✅ JWT com expiração (4h)
   - ✅ Hash de senhas (bcrypt)
   - ✅ Guards por rota
   - ✅ Sistema de roles

2. **Autorização**
   - ✅ Decorators @Roles
   - ✅ Guards de permissão
   - ✅ Rotas públicas (@Public)

3. **Validação**
   - ✅ DTOs com class-validator
   - ✅ ParseUUIDPipe
   - ✅ Validação frontend (Zod)

4. **Configuração**
   - ✅ Variáveis de ambiente
   - ✅ .env.example
   - ⚠️ .env versionado? (VERIFICAR)

### ❌ Faltando (13%)

1. **CORS WebSocket**
   - ✅ Corrigido (origin restrito)
   - ✅ Credentials habilitado

2. **Rate Limiting**
   - ❌ Sem proteção contra DDoS
   - ❌ Sem throttling de requisições

3. **Sanitização**
   - ❌ Sem proteção XSS explícita
   - ❌ Sem proteção SQL Injection (TypeORM protege?)

4. **Headers de Segurança**
   - ❌ Helmet.js não configurado
   - ❌ CSP não definido
   - ❌ HSTS não habilitado

5. **Logs Sensíveis**
   - ✅ Senhas mascaradas
   - ⚠️ Tokens podem vazar em logs?

6. **Auditoria**
   - ❌ Sem log de tentativas de acesso
   - ❌ Sem rastreamento de alterações

### 🔧 Correções de Segurança Necessárias

```typescript
// backend/src/main.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // max 100 requisições por IP
}));

// Headers de segurança
app.use(helmet());

// CORS específico
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});

// Sanitização
import * as mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());
```

---

## 🐛 BUGS CONHECIDOS

### 🔴 Críticos (CORRIGIDOS)

1. ✅ **Race Condition em Comanda**
   - Status: CORRIGIDO (transação com lock)
   - Commit: Implementado

2. ✅ **CORS Aberto WebSocket**
   - Status: CORRIGIDO (origin restrito)
   - Commit: Implementado

3. ✅ **URL Hardcoded**
   - Status: CORRIGIDO (variável de ambiente)
   - Commit: Implementado

4. ✅ **Cálculo Monetário Impreciso**
   - Status: CORRIGIDO (Decimal.js)
   - Commit: Implementado

5. ✅ **Validação de Quantidade**
   - Status: CORRIGIDO (max 100)
   - Commit: Implementado

### 🟠 Médios (VERIFICAR)

1. ⚠️ **Timeout HTTP**
   - Status: CORRIGIDO (30s)
   - Verificar: Testado em produção?

2. ⚠️ **Polling Redundante**
   - Status: CORRIGIDO
   - Verificar: Apenas com WebSocket down?

3. ⚠️ **Token Expirado**
   - Status: CORRIGIDO (redirect)
   - Verificar: Renova automaticamente?

### 🟡 Baixos (OPCIONAIS)

1. ⏳ **Paginação**
   - Status: PENDENTE
   - Impacto: Performance com muitos dados

2. ⏳ **Índices no Banco**
   - Status: PENDENTE
   - Impacto: Queries lentas

3. ⏳ **Soft Delete**
   - Status: PENDENTE
   - Impacto: Auditoria

---

## 📈 PERFORMANCE

### ⚠️ Pontos de Atenção

1. **Sem Cache**
   - React Query instalado mas não usado
   - Redis não configurado
   - Queries repetidas

2. **Sem Paginação**
   - Todos os pedidos carregados de uma vez
   - Todas as comandas carregadas
   - Problema com +1000 registros

3. **Sem Índices**
   - Migrations sem índices
   - Queries podem ficar lentas

4. **WebSocket + Polling**
   - Corrigido (polling apenas se WebSocket cair)
   - Testar em produção

### 🔧 Otimizações Recomendadas

```typescript
// 1. Paginação
@Get()
async findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 20
) {
  const skip = (page - 1) * limit;
  return await this.repository.find({ 
    skip, 
    take: limit 
  });
}

// 2. Cache com Redis
import { CACHE_MANAGER } from '@nestjs/cache-manager';
@Inject(CACHE_MANAGER) private cacheManager: Cache;

// 3. Índices
@Index(['status', 'createdAt'])
@Entity('pedidos')

// 4. Query otimizada
.createQueryBuilder('pedido')
.select(['pedido.id', 'pedido.total']) // apenas campos necessários
.leftJoinAndSelect('pedido.itens', 'itens')
.where('pedido.status = :status', { status })
.getMany();
```

---

## 🚀 PLANO DE AÇÃO PARA VENDA

### Sprint 1 - BLOQUEADORES (3 semanas)

#### Semana 1-2: Sistema de Pagamentos
- [ ] Criar módulo `pagamento`
- [ ] Entidades: Pagamento, FormaPagamento, MovimentoCaixa
- [ ] Endpoints: processar, listar, estornar
- [ ] Frontend: Tela de pagamento no caixa
- [ ] Integração PIX (opcional Sprint 2)
- [ ] Testes unitários

#### Semana 2-3: Relatórios Financeiros
- [ ] Relatório de vendas por período
- [ ] Relatório de vendas por produto
- [ ] Dashboard financeiro
- [ ] Exportação PDF/Excel
- [ ] Gráficos (Chart.js ou Recharts)

#### Semana 3: Testes
- [ ] Testes unitários críticos
- [ ] Testes de integração
- [ ] Smoke tests E2E
- [ ] Testes de carga básicos

---

### Sprint 2 - ESTABILIZAÇÃO (2 semanas)

#### Semana 1: Segurança
- [ ] Rate limiting
- [ ] Helmet.js
- [ ] Auditoria básica
- [ ] Backup automático
- [ ] Documentação de disaster recovery

#### Semana 2: Performance
- [ ] Paginação em endpoints críticos
- [ ] Índices no banco
- [ ] Cache com React Query
- [ ] Otimização de queries

---

### Sprint 3 - POLIMENTO (1 semana)

#### UX/UI
- [ ] Feedback visual melhorado
- [ ] Loading states consistentes
- [ ] Mensagens de erro claras
- [ ] Confirmações em ações críticas
- [ ] Tour guiado para novos usuários

#### Documentação
- [ ] Manual do usuário
- [ ] Vídeos tutoriais
- [ ] FAQ
- [ ] Guia de troubleshooting

---

## 💰 ESTIMATIVA DE ESFORÇO

### Desenvolvimento
| Sprint | Atividade | Horas | Desenvolvedores | Dias Úteis |
|--------|-----------|-------|-----------------|------------|
| 1 | Pagamentos | 80h | 2 | 10 dias |
| 1 | Relatórios | 60h | 1 | 12 dias |
| 1 | Testes | 40h | 1 | 10 dias |
| 2 | Segurança | 30h | 1 | 6 dias |
| 2 | Performance | 30h | 1 | 6 dias |
| 3 | UX/UI | 20h | 1 | 5 dias |
| 3 | Documentação | 20h | 1 | 5 dias |
| **TOTAL** | | **280h** | **2-3** | **~6 semanas** |

### Custos Estimados
- **2 Desenvolvedores Full-Stack:** R$ 15.000/mês × 1.5 meses = R$ 22.500
- **1 QA:** R$ 8.000/mês × 1 mês = R$ 8.000
- **Infraestrutura (AWS/Azure):** R$ 500/mês
- **Domínio + SSL:** R$ 200/ano
- **Total Estimado:** R$ 31.200

---

## ✅ CHECKLIST PRÉ-VENDA

### Funcionalidades Essenciais
- [x] Gestão de mesas
- [x] Gestão de produtos
- [x] Gestão de funcionários
- [x] Criar comanda
- [x] Fazer pedidos
- [x] Cozinha receber pedidos
- [x] Atualizar status
- [x] Garçom entregar
- [ ] **Processar pagamento** ❌
- [ ] **Fechar caixa** ❌
- [ ] **Relatórios básicos** ❌

### Segurança
- [x] Autenticação JWT
- [x] Autorização por roles
- [x] Validação de dados
- [x] CORS configurado
- [ ] Rate limiting ❌
- [ ] Helmet.js ❌
- [ ] Backup automático ❌

### Performance
- [x] WebSocket funcionando
- [ ] Paginação ⚠️
- [ ] Cache ⚠️
- [ ] Índices no banco ⚠️

### Qualidade
- [ ] Testes unitários (60%) ⚠️
- [ ] Testes E2E (5%) ❌
- [ ] Testes de carga (0%) ❌
- [ ] Code review ⚠️

### Documentação
- [x] README completo
- [x] Guia de setup
- [ ] Manual do usuário ❌
- [ ] Vídeos tutoriais ❌

### Deploy
- [ ] Ambiente de produção ❌
- [ ] CI/CD pipeline ❌
- [ ] Monitoramento ❌
- [ ] Alertas ❌
- [ ] Logs centralizados ⚠️

---

## 🎯 RECOMENDAÇÃO FINAL

### Status Atual: **NÃO PRONTO PARA VENDA**

### Razão Principal:
**❌ Sistema de pagamentos ausente é um BLOQUEADOR TOTAL**

Sem processar pagamentos, o sistema não fecha o ciclo completo de vendas, tornando impossível seu uso comercial real.

### Prazo Realista para Venda:
**6-8 semanas** com equipe de 2-3 desenvolvedores

### Próximos Passos Recomendados:

1. **URGENTE (Semana 1-2):**
   - Implementar módulo de pagamentos básico
   - Formas: Dinheiro, Cartão, PIX
   - Fechar comanda com pagamento

2. **IMPORTANTE (Semana 3-4):**
   - Relatório de vendas básico
   - Dashboard financeiro simples
   - Controle de caixa (abertura/fechamento)

3. **ESSENCIAL (Semana 5-6):**
   - Testes automatizados críticos
   - Segurança (rate limit, helmet)
   - Performance (paginação, índices)

4. **DESEJÁVEL (Semana 7-8):**
   - Manual do usuário
   - Vídeos tutoriais
   - Deploy em produção
   - Monitoramento

### Alternativa: MVP Reduzido (3-4 semanas)

Se necessário lançar mais rápido, considerar MVP com:
- ✅ Tudo que já existe
- ✅ Pagamento básico (só dinheiro)
- ✅ Relatório simples (apenas vendas totais)
- ✅ Testes mínimos (smoke tests)

**Mas é arriscado** lançar sem testes completos e monitoramento.

---

## 📞 CONTATO

Para dúvidas sobre este relatório:
- **Email:** pereira_hebert@msn.com
- **Telefone:** (24) 99828-5751

---

**Gerado em:** 18 de novembro de 2025  
**Próxima Revisão:** Após implementação do Sprint 1
