# 🔴 Correções de TenantId Pendentes - Pub System

> **Data da Análise:** 9 de Janeiro de 2026  
> **Status:** 18 problemas identificados  
> **Impacto:** Vazamento de dados entre tenants (bares)

---

## 📊 Resumo Executivo

| Prioridade | Quantidade | Risco |
|------------|------------|-------|
| 🔴 CRÍTICA | 6 | Vazamento de dados entre bares |
| 🟠 ALTA | 6 | Dados podem ser criados sem tenant |
| 🟡 MÉDIA | 4 | Comportamento inconsistente |
| 🟢 BAIXA | 2 | Duplicação de lógica |
| **TOTAL** | **18** | |

---

## 🔴 PRIORIDADE CRÍTICA (Vazamento de Dados)

### 1. FuncionarioService - Sem filtro de tenant
**Arquivo:** `backend/src/modulos/funcionario/funcionario.service.ts`

**Problema:** Usa `@InjectRepository(Funcionario)` direto. Todos os métodos (`findAll`, `findOne`, `create`, etc.) operam SEM filtro de tenant.

**Impacto:** Um bar pode ver/editar funcionários de outro bar.

**Correção:**
```typescript
// ANTES (errado)
@InjectRepository(Funcionario)
private readonly funcionarioRepository: Repository<Funcionario>

// DEPOIS (correto)
constructor(
  private readonly funcionarioRepository: FuncionarioRepository, // tenant-aware
) {}
```

---

### 2. AvaliacaoService - Sem filtro de tenant
**Arquivo:** `backend/src/modulos/avaliacao/avaliacao.service.ts`

**Problema:** Usa `@InjectRepository(Avaliacao)` direto. Avaliações de clientes podem vazar entre bares.

**Correção:** Criar `AvaliacaoRepository extends BaseTenantRepository<Avaliacao>`.

---

### 3. AuditService - Logs expostos entre tenants
**Arquivo:** `backend/src/audit/audit.service.ts`

**Problema:** Usa `@InjectRepository(AuditLog)` direto. Um bar pode ver logs de auditoria de outro bar.

**Impacto LGPD:** Exposição de dados sensíveis de operações de outros estabelecimentos.

**Correção:** Criar `AuditRepository extends BaseTenantRepository<AuditLog>`.

---

### 4. EventoService - Eventos expostos
**Arquivo:** `backend/src/modulos/evento/evento.service.ts`

**Problema:** Usa `@InjectRepository(Evento)` direto. Eventos de um bar podem ser vistos/editados por outro.

**Correção:** Criar `EventoRepository extends BaseTenantRepository<Evento>`.

---

### 5. PaginaEventoService - Landing pages expostas
**Arquivo:** `backend/src/modulos/pagina-evento/pagina-evento.service.ts`

**Problema:** Usa `@InjectRepository(PaginaEvento)` direto.

**Correção:** Criar `PaginaEventoRepository extends BaseTenantRepository<PaginaEvento>`.

---

### 6. MedalhaService - Medalhas expostas
**Arquivo:** `backend/src/modulos/medalha/medalha.service.ts`

**Problema:** Usa repositórios diretos para `Medalha`, `GarcomMedalha` e `GarcomEstatisticas`.

**Correção:** Criar repositórios tenant-aware para cada entidade.

---

## 🟠 PRIORIDADE ALTA (Criação sem Tenant)

### 7. PedidoService - Criação dentro de transação
**Arquivo:** `backend/src/modulos/pedido/pedido.service.ts`  
**Linhas:** ~289-313

**Problema:** No método `create`, a criação de `ItemPedido` e `ItemPedidoAdicional` dentro da transação usa `transactionalEntityManager.create()` SEM passar `tenantId` explicitamente.

**Correção:**
```typescript
// Adicionar tenantId nas criações:
const item = transactionalEntityManager.create(ItemPedido, {
  ...dados,
  tenantId: resolvedTenantId, // ✅ ADICIONAR
});
```

---

### 8. EmpresaService - Sem filtro adequado
**Arquivo:** `backend/src/modulos/empresa/empresa.service.ts`

**Problema:** Usa `@InjectRepository(Empresa)` direto. Queries não garantem isolamento.

**Correção:** Criar `EmpresaRepository extends BaseTenantRepository<Empresa>`.

---

### 9. CaixaService - Criação pode falhar
**Arquivo:** `backend/src/modulos/caixa/caixa.service.ts`  
**Linha:** ~81

**Problema:** No método `abrirCaixa`, o `caixaRepository.create()` não valida explicitamente se tenantId existe.

**Correção:**
```typescript
async abrirCaixa(dto: AbrirCaixaDto) {
  const tenantId = this.getTenantId();
  if (!tenantId) {
    throw new BadRequestException('Tenant não identificado');
  }
  // ... resto do código
}
```

---

### 10. AnalyticsService - Queries sem filtro
**Arquivo:** `backend/src/modulos/analytics/analytics.service.ts`

**Problema:** Usa repositórios diretos para `Pedido`, `ItemPedido`, `Funcionario`, `Comanda`. Relatórios podem misturar dados de diferentes bares.

**Correção:** Usar repositórios tenant-aware existentes ou criar novos.

---

### 11. PlanoService - Validações faltando
**Arquivo:** `backend/src/modulos/plano/plano.service.ts`

**Problema:** Planos são globais (correto), mas falta validação de permissão Super Admin para criar/editar.

**Correção:** Adicionar guard `@Roles('SUPER_ADMIN')` nos endpoints de escrita.

---

### 12. TurnoService - Criação sem validação
**Arquivo:** `backend/src/modulos/turno/turno.service.ts`  
**Linha:** ~125

**Problema:** `checkIn()` pode criar turno sem tenant se o contexto estiver vazio.

**Correção:**
```typescript
async checkIn(funcionarioId: string) {
  // Validar tenant antes
  const tenantId = this.turnoRepository.getCurrentTenantId();
  if (!tenantId) {
    throw new ForbiddenException('Contexto de tenant não identificado');
  }
  // ... resto
}
```

---

## 🟡 PRIORIDADE MÉDIA (Inconsistências)

### 13. ClienteService - Decisão de design
**Arquivo:** `backend/src/modulos/cliente/cliente.service.ts`

**Problema:** `findByCpf` usa `clienteRepository.findWithoutTenant()`. Clientes são globais por CPF (decisão de design), mas não está documentado.

**Correção:** Documentar se clientes são:
- **Globais:** CPF único no sistema (atual)
- **Por tenant:** Cada bar tem seus próprios clientes

---

### 14. SeedService - Admin pode ir para tenant errado
**Arquivo:** `backend/src/database/seed/seed.service.ts`

**Problema:** Cria admin com tenantId do primeiro tenant encontrado. Se houver múltiplos, pode associar ao errado.

**Correção:** Criar admin como Super Admin global (sem tenant) ou criar um admin por tenant.

---

### 15. RefreshTokenService - Listagem exposta
**Arquivo:** `backend/src/auth/refresh-token.service.ts`

**Problema:** Tokens são globais (correto), mas listagem de sessões deveria filtrar por tenant quando admin não é Super Admin.

**Correção:** Filtrar por tenant do usuário logado nos métodos de listagem.

---

### 16. ComandaService - Lógica duplicada
**Arquivo:** `backend/src/modulos/comanda/comanda.service.ts`

**Problema:** Método `resolveAndGetTenantId()` duplica lógica do `TenantInterceptor`.

**Correção:** Confiar no interceptor e simplificar. *(Já corrigido parcialmente)*

---

## 🟢 PRIORIDADE BAIXA (Melhorias)

### 17. BaseTenantRepository - Documentação
**Arquivo:** `backend/src/common/tenant/repositories/base-tenant.repository.ts`

**Problema:** Métodos `findWithoutTenant()` e `createQueryBuilderUnsafe()` são necessários mas perigosos.

**Correção:** Adicionar comentários JSDoc explicando quando usar cada método.

---

### 18. Rotas Públicas - Padronização
**Arquivos:** Vários controllers com `@Public()`

**Problema:** Cada rota pública resolve tenant de forma diferente.

**Correção:** Criar decorator `@PublicWithTenant()` que garante resolução de tenant via slug.

---

## ✅ Correções Já Aplicadas Nesta Sessão

| Data | Correção | Commit |
|------|----------|--------|
| 09/01/2026 | `ComandaService.search()` - `.where()` → `.andWhere()` | `8a2d628` |
| 09/01/2026 | `ComandaService.create()` - Adicionar `tenantId` na criação | `6c82c2d` |
| 09/01/2026 | `PedidoService.create()` - Carregar `tenantId` da comanda | `4eeb4cd` |
| 09/01/2026 | `PedidosGateway` - Emissão dual (tenant + comanda rooms) | `dfad69f` |

---

## 📋 Plano de Ação Recomendado

### Fase 1 - Crítico (1-2 dias)
1. [ ] Criar `FuncionarioRepository` extends BaseTenantRepository
2. [ ] Criar `AuditRepository` extends BaseTenantRepository  
3. [ ] Criar `EventoRepository` extends BaseTenantRepository
4. [ ] Criar `PaginaEventoRepository` extends BaseTenantRepository
5. [ ] Criar `AvaliacaoRepository` extends BaseTenantRepository
6. [ ] Criar repositórios para `Medalha`, `GarcomMedalha`, `GarcomEstatisticas`

### Fase 2 - Alta (2-3 dias)
7. [ ] Corrigir `PedidoService.create()` - tenantId nos itens
8. [ ] Criar `EmpresaRepository` extends BaseTenantRepository
9. [ ] Adicionar validação de tenant em `CaixaService.abrirCaixa()`
10. [ ] Corrigir `AnalyticsService` para usar repositórios tenant-aware
11. [ ] Adicionar guard Super Admin em `PlanoService`
12. [ ] Validar tenant em `TurnoService.checkIn()`

### Fase 3 - Média (1 dia)
13. [ ] Documentar decisão sobre clientes globais vs por tenant
14. [ ] Revisar lógica de seed do admin
15. [ ] Filtrar sessões por tenant em `RefreshTokenService`
16. [ ] Remover lógica duplicada de resolução de tenant

### Fase 4 - Baixa (opcional)
17. [ ] Melhorar documentação do BaseTenantRepository
18. [ ] Criar decorator `@PublicWithTenant()`

---

## 🔗 Arquivos Relacionados

- [BaseTenantRepository](../backend/src/common/tenant/repositories/base-tenant.repository.ts)
- [TenantInterceptor](../backend/src/common/tenant/tenant.interceptor.ts)
- [TenantResolverService](../backend/src/common/tenant/tenant-resolver.service.ts)

---

*Documento gerado automaticamente por análise de código*
