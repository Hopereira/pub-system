# 🏢 Multi-Tenancy – Análise Atualizada (24/12/2025)

**Situação real:** o Pub System já opera com arquitetura multi-tenant ativa usando **banco compartilhado + coluna `tenant_id`**, possui automação de provisionamento (incluindo DNS no Cloudflare) e mecanismos de isolamento no backend. Ainda há lacunas pontuais em serviços legados e no frontend (ausência de seletor de tenant e interceptores dedicados), mas o núcleo está funcional em produção local.

---

## 📌 Visão Geral do Status

| Camada                           | Status | Observações |
|----------------------------------|--------|-------------|
| Modelo de dados (`tenant_id`)    | ✅ Ok  | Principais entidades já possuem índice por tenant (ex.: `ambientes`, `mesas`, `funcionarios`). @backend/src/modulos/ambiente/entities/ambiente.entity.ts#15-55 @backend/src/modulos/mesa/entities/mesa.entity.ts#23-71 @backend/src/modulos/funcionario/entities/funcionario.entity.ts#16-82 |
| Contexto/Interceptor/Guard       | ✅ Ok  | `TenantContextService`, `TenantInterceptor` e `TenantGuard` garantem isolamento por request. @backend/src/common/tenant/tenant-context.service.ts#1-119 @backend/src/common/tenant/tenant.interceptor.ts#42-164 @backend/src/common/tenant/guards/tenant.guard.ts#1-154 |
| JWT / Autenticação               | ✅ Ok  | Tokens carregam `tenantId` e `empresaId`, propagando isolamento para refresh tokens. @backend/src/auth/auth.service.ts#28-116 |
| Provisionamento + DNS            | ✅ Ok  | Novo tenant cria empresa, ambientes, mesas, admin e já registra subdomínio via Cloudflare. @backend/src/common/tenant/services/tenant-provisioning.service.ts#1-230 @docs/2025-12-24-SESSAO-FIXES-TENANT-CLOUDFLARE-DNS.md#1-299 |
| Cache / Repositórios isolados    | ✅ Ok  | Redis namespaced por tenant e repositórios tenant-aware implantados para módulos críticos. @docs/2025-12-22-CORRECOES-ISOLAMENTO-MULTI-TENANCY.md#9-352 |
| Super Admin / Gestão de tenants  | ✅ Ok  | Frontend possui serviço específico para métricas, CRUD e change-plan dos tenants. @frontend/src/services/superAdminService.ts#1-148 |
| Frontend operacional (usuário)   | ⚠️ Parcial | Token inclui tenant, porém não existe `TenantContext` nem seletor/indicador; chamadas dependem apenas do JWT. @frontend/src/context/AuthContext.tsx#1-67 @frontend/src/services/api.ts#1-196 |
| Serviços legados                 | ⚠️ Parcial | Alguns serviços ainda usam repositórios genéricos e não foram migrados para tenant-aware (ex.: partes de Comanda/Eventos). @docs/2025-12-22-CORRECOES-ISOLAMENTO-MULTI-TENANCY.md#206-217 |
| Segurança avançada (RLS, auditoria completa) | ⚠️ Pendente | Não há RLS no Postgres nem auditoria automatizada de violações além do guard.

---

## 🔍 Implementação que Já Está em Produção Local

### 1. Modelo de Dados com `tenant_id`
- Entidades-chave (`ambientes`, `mesas`, `funcionarios`, `empresas`) carregam coluna `tenant_id`, índices e relações necessárias para o isolamento lógico. @backend/src/modulos/ambiente/entities/ambiente.entity.ts#15-55 @backend/src/modulos/mesa/entities/mesa.entity.ts#23-71 @backend/src/modulos/funcionario/entities/funcionario.entity.ts#16-82 @backend/src/modulos/empresa/entities/empresa.entity.ts#1-43
- Migration específicas garantem unique composto (ex.: email de funcionário único por tenant). @docs/2025-12-19-CORRECOES-MULTI-TENANCY-E-CARDAPIO.md#11-139

### 2. Contexto de Tenant + Interceptor + Guard
- `TenantContextService` é escopo de request e torna o tenant imutável após resolvido. @backend/src/common/tenant/tenant-context.service.ts#1-119
- `TenantInterceptor` identifica o tenant por subdomínio/slug/JWT/header e popula tanto o contexto quanto `request.tenant`. @backend/src/common/tenant/tenant.interceptor.ts#42-164
- `TenantGuard` impede acesso cross-tenant comparando tenant do JWT com o do contexto e registra tentativas suspeitas. @backend/src/common/tenant/guards/tenant.guard.ts#1-154

### 3. Autenticação e Tokens
- Payload JWT contém `tenantId`, `empresaId`, `ambienteId` e demais dados necessários para autorização. @backend/src/auth/auth.service.ts#28-116
- Refresh tokens também são vinculados ao tenant, evitando reutilização cruzada.

### 4. Provisionamento Automático (Infra + DNS)
- `TenantProvisioningService` cria tenant, empresa, ambientes padrão, mesas e usuário admin em transação única; após o commit executa criação de subdomínio no Cloudflare através do `CloudflareDnsService`. @backend/src/common/tenant/services/tenant-provisioning.service.ts#1-230 @docs/2025-12-24-SESSAO-FIXES-TENANT-CLOUDFLARE-DNS.md#81-229
- `.env` agora possui variáveis de API Token / Zone ID / IP alvo; caso não estejam configuradas, o sistema faz graceful degradation e avisa nos logs. @docs/2025-12-24-SESSAO-FIXES-TENANT-CLOUDFLARE-DNS.md#152-229

### 5. Cache e Repositórios Tenant-Aware
- Todas as chaves Redis incluem o tenant (`entity:{tenantId}:...`) e existe utilitário para invalidar caches por tenant. @docs/2025-12-22-CORRECOES-ISOLAMENTO-MULTI-TENANCY.md#9-173
- Serviços críticos (pedidos, caixa, mesas, ambientes, produtos, turnos) migraram para repositórios próprios com escopo REQUEST, evitando `@InjectRepository` genérico. @docs/2025-12-22-CORRECOES-ISOLAMENTO-MULTI-TENANCY.md#85-174

### 6. Ferramentas de Administração Multi-Tenant
- O frontend expõe `superAdminService` com métricas globais, listagem de tenants, provisionamento, suspensão/reactivação e mudança de planos. @frontend/src/services/superAdminService.ts#1-148
- Existe endpoint dedicado a métricas da plataforma (MRR, pedidos/dia, etc.), usados na dashboard do super admin.

### 7. Testes e Diagnósticos Recentes
- Sessões de 19, 22 e 24/12 documentam correções reais (email único por tenant, cache isolado, criação de DNS) e comandos utilizados, confirmando funcionamento prático. @docs/2025-12-19-CORRECOES-MULTI-TENANCY-E-CARDAPIO.md#1-164 @docs/2025-12-22-CORRECOES-ISOLAMENTO-MULTI-TENANCY.md#1-352 @docs/2025-12-24-SESSAO-FIXES-TENANT-CLOUDFLARE-DNS.md#1-299

---

## ⚠️ Lacunas e Riscos Abertos

1. **Frontend sem Tenant Contexto explícito**
   - O `AuthContext` apenas decodifica o token; não há seletor/troca de tenant nem interceptor que injete `X-Tenant-ID`. Isso dificulta cenários onde um usuário pertence a múltiplos estabelecimentos ou precisa alternar manualmente. @frontend/src/context/AuthContext.tsx#1-67 @frontend/src/services/api.ts#1-196
   - Próximo passo: criar `TenantProvider`, persistir tenant escolhido e ajustar `api` para enviar o header automaticamente (conforme proposto nos docs antigos).

2. **Serviços que ainda usam repositórios genéricos**
   - De acordo com o relatório de 22/12, módulos como `ComandaService` (dependências em `PaginaEvento`, `Evento`, `PontoEntrega`), `MedalhaService` e `EventoService` precisam ser migrados para repositórios tenant-aware para garantir isolamento completo. @docs/2025-12-22-CORRECOES-ISOLAMENTO-MULTI-TENANCY.md#206-217

3. **Ausência de Row Level Security (RLS)**
   - O isolamento depende 100% da camada de aplicação; não há políticas RLS no Postgres ainda. Qualquer deslize em um serviço pode reabrir brechas.

4. **Auditoria e alertas**
   - `TenantGuard` loga tentativas cross-tenant, mas não há integração com `AuditService` ou alertas externos (TODO registrado no próprio guard). @backend/src/common/tenant/guards/tenant.guard.ts#115-153

5. **Experiência do Cliente (subdomínios)**
   - DNS automático foi implementado, porém ainda faltam ajustes no Nginx da Oracle VM para wildcard/SSL e remoção automática de registros quando um tenant é deletado (listado nos próximos passos do relatório de 24/12). @docs/2025-12-24-SESSAO-FIXES-TENANT-CLOUDFLARE-DNS.md#281-287

---

## 🧭 Roadmap Recomendado (Prioridade Decrescente)

1. **Finalizar migração para repositórios tenant-aware**  
   - Comanda, Evento, Medalha e demais módulos pendentes.  
   - Acrescentar testes automatizados garantindo `tenantId` em todas as queries.

2. **Tenant Experience no Frontend**  
   - Implementar `TenantContext`, seletor no login (quando usuário tiver múltiplos tenants) e indicador visual no header, seguindo o desenho original.  
   - Interceptor Axios deve enviar `X-Tenant-ID` além do JWT, permitindo operações administrativas (ex.: Super Admin trocando de tenant).

3. **Hardening de Segurança**  
   - Habilitar RLS nas tabelas críticas (produtos, comandas, pedidos, itens).  
   - Integrar `TenantGuard` com `AuditService` + alertas (Slack/Email).  
   - Considerar políticas de rate limit por tenant (`tenant-rate-limit.guard.ts` já existe e pode ser aproveitado).

4. **Operação em Produção**  
   - Automatizar configuração do Nginx para subdomínios (wildcard ou templates).  
   - Criar rotina de limpeza de DNS quando um tenant é removido/inativado.

5. **Documentação & Observabilidade**  
   - Atualizar README/SETUP com o fluxo multi-tenant atual.  
   - Adicionar dashboards (Grafana/ELK) filtrados por tenantId para identificar gargalos específicos.

---

## 📈 Conclusão

- O sistema **já é multi-tenant na prática**, com isolamento enforcing no backend, dados segregados, cache namespaced e automação de provisionamento/DNS.  
- **Principais riscos residuais**: serviços legados sem repositórios tenant-aware, ausência de RLS e UX no frontend ainda single-tenant.  
- **Ações curtas** (TenantContext no front, migração dos serviços remanescentes e RLS) colocam o produto em nível pronto para escala comercial sem depender de vigilância manual.

> **Prioridade imediata:** finalizar migração dos serviços restantes e entregar UX para seleção de tenant. Isso elimina os dois principais riscos de vazamento e melhora a experiência dos clientes corporativos.

---

**Atualizado em:** 24/12/2025 – Cascade AI Assistant  
