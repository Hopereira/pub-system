# 🔒 Auditoria de Segurança - Controllers

**Data:** 10/12/2024  
**Auditor:** Especialista em Segurança de Aplicações  
**Branch:** `audit/security-controllers`

---

## 📊 Resumo Executivo

| Categoria | Status | Detalhes |
|-----------|--------|----------|
| **Proteção JWT** | ⚠️ PARCIAL | 2 controllers com rotas públicas perigosas |
| **Roles Configurados** | ✅ OK | Todos os endpoints sensíveis têm @Roles |
| **Validação DTOs** | ⚠️ VERIFICAR | Precisa auditoria individual |
| **Rotas Públicas** | 🔴 CRÍTICO | 3 rotas públicas perigosas identificadas |

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. TurnoController - Check-in/Check-out SEM AUTENTICAÇÃO

**Arquivo:** `backend/src/modulos/turno/turno.controller.ts`

```typescript
// LINHAS 35-46 - SEM @UseGuards!
@Post('check-in')
async checkIn(@Body() checkInDto: CheckInDto): Promise<TurnoResponseDto> {
  return this.turnoService.checkIn(checkInDto);
}

// LINHAS 48-58 - SEM @UseGuards!
@Post('check-out')
async checkOut(@Body() checkOutDto: CheckOutDto): Promise<TurnoResponseDto> {
  return this.turnoService.checkOut(checkOutDto);
}
```

**Risco:** 🔴 CRÍTICO
- Qualquer pessoa pode fazer check-in/check-out de qualquer funcionário
- Permite manipulação de turnos e horas trabalhadas
- Pode ser usado para fraude de ponto

**Correção Necessária:**
```typescript
@Post('check-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA, Cargo.CAIXA)
@ApiBearerAuth()
async checkIn(@Body() checkInDto: CheckInDto)
```

---

### 2. FuncionarioController - Registro Público

**Arquivo:** `backend/src/modulos/funcionario/funcionario.controller.ts`

```typescript
// LINHAS 47-62 - PÚBLICO!
@Post('registro')
async registro(@Body() createFuncionarioDto: CreateFuncionarioDto) {
  return this.funcionarioService.registroPrimeiroAcesso(createFuncionarioDto);
}
```

**Risco:** ⚠️ MÉDIO (mitigado pela lógica do service)
- Rota pública para criar usuário
- Service valida se já existe usuário (apenas primeiro acesso)
- **Recomendação:** Adicionar rate limiting severo

---

### 3. ClienteController - Busca Pública Expõe Dados

**Arquivo:** `backend/src/modulos/cliente/cliente.controller.ts`

```typescript
// LINHAS 93-99 - PÚBLICO!
@Public()
@Get('by-cpf')
findByCpfPublic(@Query('cpf') cpf: string) {
  return this.clienteService.findByCpf(cpf);
}

// LINHAS 103-109 - PÚBLICO!
@Public()
@Get('buscar')
buscar(@Query('q') termo: string) {
  return this.clienteService.buscar(termo);
}
```

**Risco:** ⚠️ MÉDIO
- Permite enumeração de CPFs
- Expõe dados de clientes sem autenticação
- **Recomendação:** Rate limiting + retornar apenas dados mínimos

---

## ⚠️ ROTAS PÚBLICAS - ANÁLISE

### Rotas Públicas ACEITÁVEIS (por design)

| Controller | Rota | Justificativa |
|------------|------|---------------|
| `AvaliacaoController` | `POST /avaliacoes` | Cliente avalia após fechar comanda |
| `ComandaController` | `POST /comandas` | Cliente abre comanda via QR Code |
| `ComandaController` | `GET /comandas/:id/public` | Cliente visualiza sua comanda |
| `ComandaController` | `GET /comandas/:id/agregados` | Cliente vê acompanhantes |
| `PedidoController` | `POST /pedidos/cliente` | Cliente faz pedido |
| `ProdutoController` | `GET /produtos` | Cardápio público |
| `EventoController` | `GET /eventos/publicos` | Landing pages |
| `PaginaEventoController` | `GET /paginas-evento/ativa/publica` | Landing page ativa |

### Rotas Públicas PERIGOSAS

| Controller | Rota | Risco | Ação |
|------------|------|-------|------|
| `TurnoController` | `POST /turnos/check-in` | 🔴 CRÍTICO | Adicionar JWT |
| `TurnoController` | `POST /turnos/check-out` | 🔴 CRÍTICO | Adicionar JWT |
| `ClienteController` | `GET /clientes/by-cpf` | ⚠️ MÉDIO | Rate limiting |
| `ClienteController` | `GET /clientes/buscar` | ⚠️ MÉDIO | Rate limiting |
| `ComandaController` | `PATCH /comandas/:id/local` | ⚠️ MÉDIO | Rate limiting |
| `ComandaController` | `PATCH /comandas/:id/ponto-entrega` | ⚠️ MÉDIO | Rate limiting |

---

## ✅ CONTROLLERS BEM PROTEGIDOS

### AmbienteController ✅
- Proteção global: `@UseGuards(AuthGuard('jwt'), RolesGuard)`
- Todas as rotas com `@Roles` apropriados
- POST/PUT/DELETE apenas ADMIN

### AnalyticsController ✅
- Proteção global: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Todas as rotas requerem ADMIN
- Dados sensíveis bem protegidos

### CaixaController ✅
- Proteção global: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Roles: ADMIN, CAIXA
- Operações financeiras bem protegidas

### EmpresaController ✅
- Proteção global: `@UseGuards(JwtAuthGuard, RolesGuard)`
- Todas as rotas apenas ADMIN
- Dados da empresa protegidos

### MesaController ✅
- Proteção global: `@UseGuards(JwtAuthGuard, RolesGuard)`
- POST/PATCH/DELETE apenas ADMIN
- GET permite GARCOM, CAIXA

### PedidoController ✅
- Rotas internas protegidas com JWT
- DELETE apenas ADMIN
- Rota pública `/cliente` é intencional

### PontoEntregaController ✅
- Proteção global: `@UseGuards(JwtAuthGuard, RolesGuard)`
- POST/PATCH/DELETE apenas ADMIN

### ProdutoController ✅
- POST/PATCH/DELETE apenas ADMIN
- GET público (cardápio) é intencional

### EventoController ✅
- POST/PATCH/DELETE apenas ADMIN
- GET público para landing pages é intencional

### PaginaEventoController ✅
- POST/PATCH/DELETE apenas ADMIN
- GET público para landing pages é intencional

### MedalhaController ⚠️
- Proteção global: `@UseGuards(JwtAuthGuard, RolesGuard)`
- **Falta @Roles** nas rotas individuais
- Qualquer usuário autenticado pode acessar

---

## 📋 PLANO DE CORREÇÃO

### Prioridade 1 - CRÍTICO (Fazer AGORA)

1. **TurnoController** - Adicionar autenticação em check-in/check-out
2. **Rate Limiting** - Adicionar nas rotas públicas de cliente

### Prioridade 2 - ALTA

3. **MedalhaController** - Adicionar @Roles nas rotas
4. **ClienteController** - Limitar dados retornados em buscas públicas

### Prioridade 3 - MÉDIA

5. **Auditoria de DTOs** - Verificar validações em todos os DTOs
6. **Logs de Segurança** - Adicionar logs em operações sensíveis

---

## 🔧 CORREÇÕES RECOMENDADAS

### Correção 1: TurnoController

```typescript
@Post('check-in')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA, Cargo.CAIXA)
@ApiBearerAuth()
@ApiOperation({ summary: 'Fazer check-in (iniciar turno)' })
async checkIn(@Body() checkInDto: CheckInDto): Promise<TurnoResponseDto> {
  return this.turnoService.checkIn(checkInDto);
}

@Post('check-out')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Cargo.ADMIN, Cargo.GARCOM, Cargo.COZINHA, Cargo.CAIXA)
@ApiBearerAuth()
@ApiOperation({ summary: 'Fazer check-out (finalizar turno)' })
async checkOut(@Body() checkOutDto: CheckOutDto): Promise<TurnoResponseDto> {
  return this.turnoService.checkOut(checkOutDto);
}
```

### Correção 2: MedalhaController

```typescript
@Get('garcom/:garcomId')
@Roles(Cargo.ADMIN, Cargo.GARCOM)
async getMedalhasGarcom(@Param('garcomId') garcomId: string) {
  return this.medalhaService.getMedalhasGarcom(garcomId);
}
```

---

## 📊 Matriz de Proteção por Controller

| Controller | JWT Global | Roles Global | Rotas Públicas | Status |
|------------|:----------:|:------------:|:--------------:|:------:|
| AmbienteController | ✅ | ✅ | 0 | ✅ |
| AnalyticsController | ✅ | ✅ | 0 | ✅ |
| AvaliacaoController | ❌ | ❌ | 1 | ⚠️ |
| CaixaController | ✅ | ✅ | 0 | ✅ |
| ClienteController | ❌ | ❌ | 4 | ⚠️ |
| ComandaController | ❌ | ❌ | 5 | ⚠️ |
| EmpresaController | ✅ | ✅ | 0 | ✅ |
| EventoController | ❌ | ❌ | 2 | ⚠️ |
| FuncionarioController | ❌ | ❌ | 2 | ⚠️ |
| MedalhaController | ✅ | ❌ | 0 | ⚠️ |
| MesaController | ✅ | ❌ | 0 | ✅ |
| PaginaEventoController | ❌ | ❌ | 2 | ⚠️ |
| PedidoController | ❌ | ❌ | 1 | ⚠️ |
| PontoEntregaController | ✅ | ❌ | 0 | ✅ |
| ProdutoController | ❌ | ❌ | 1 | ⚠️ |
| TurnoController | ❌ | ❌ | 2 | 🔴 |

---

*Auditoria realizada em 10/12/2024*
