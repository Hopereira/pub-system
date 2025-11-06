# 🔄 Proposta de Refatoração: Sistema de Gestão de Mesas por Ambiente

**Data:** 06/11/2025  
**Status:** 📋 PROPOSTA  
**Objetivo:** Refatorar gestão de mesas para trabalhar por ambiente com mapa visual integrado

---

## 🎯 Objetivo da Refatoração

Criar um fluxo unificado onde o **Admin**:
1. Cria um **Ambiente** (ex: Salão Principal, Varanda, Jardim)
2. Acessa o **Configurador de Layout** daquele ambiente
3. **Adiciona mesas** diretamente no mapa visual (drag & drop)
4. **Posiciona as mesas** no layout
5. **Salva** tudo de uma vez

### Benefícios
- ✅ Fluxo mais intuitivo e visual
- ✅ Menos cliques e navegação
- ✅ Mesas criadas já com posição definida
- ✅ Visão espacial desde o início
- ✅ Reduz erros de configuração

---

## 📊 Estado Atual vs Proposto

### ❌ Fluxo Atual (Problemático)
```
1. Admin → /dashboard/admin/mesas
2. Clica "Adicionar Nova Mesa"
3. Preenche formulário (número + ambiente)
4. Salva mesa SEM posição
5. Admin → /dashboard/mapa/configurar
6. Arrasta mesa para posição
7. Salva posição separadamente
```

**Problemas:**
- Dois passos separados (criar + posicionar)
- Mesa existe sem posição no mapa
- Navegação entre páginas
- Confusão sobre onde criar mesas

### ✅ Fluxo Proposto (Otimizado)
```
1. Admin → /dashboard/admin/ambientes
2. Clica em "Configurar Layout" de um ambiente
3. Redireciona para /dashboard/mapa/configurar?ambienteId=X
4. Admin vê mapa vazio do ambiente
5. Clica "Adicionar Mesa" no configurador
6. Mesa aparece no mapa (pode arrastar imediatamente)
7. Admin posiciona, rotaciona, redimensiona
8. Clica "Salvar Layout"
9. ✅ Mesa criada + posicionada de uma vez
```

**Vantagens:**
- Um único fluxo integrado
- Mesa criada já com posição
- Visão espacial imediata
- Menos navegação

---

## 🗺️ Estrutura de Rotas Proposta

### Rotas Existentes (Manter)
```
/dashboard/admin/ambientes
  ├─ Lista todos os ambientes
  ├─ CRUD de ambientes
  └─ Botão "Configurar Layout" por ambiente

/dashboard/admin/mesas (DEPRECAR ou SIMPLIFICAR)
  ├─ Lista todas as mesas (read-only)
  ├─ Editar número da mesa
  └─ Deletar mesa (se LIVRE)

/garcom/mapa
  ├─ Visualização operacional
  ├─ Mesas com cores por status
  └─ Filtro de pedidos prontos
```

### Rota Principal (Refatorar)
```
/dashboard/mapa/configurar?ambienteId={uuid}
  ├─ RoleGuard: ['ADMIN', 'GERENTE']
  ├─ Carrega mesas APENAS daquele ambiente
  ├─ Botão "Adicionar Mesa" (cria + posiciona)
  ├─ Drag & drop de mesas
  ├─ Rotação e redimensionamento
  ├─ Botão "Salvar Layout"
  └─ Botão "Voltar para Ambientes"
```

---

## 🏗️ Arquitetura Proposta

### 1. Página de Ambientes (Ponto de Entrada)
**Arquivo:** `frontend/src/app/(protected)/dashboard/admin/ambientes/page.tsx`

```typescript
// Lista de ambientes com botão "Configurar Layout"
<Table>
  {ambientes.map(ambiente => (
    <TableRow>
      <TableCell>{ambiente.nome}</TableCell>
      <TableCell>{ambiente.tipo}</TableCell>
      <TableCell>
        <Button onClick={() => router.push(`/dashboard/mapa/configurar?ambienteId=${ambiente.id}`)}>
          <Settings /> Configurar Layout
        </Button>
      </TableCell>
    </TableRow>
  ))}
</Table>
```

### 2. Configurador de Mapa (Refatorado)
**Arquivo:** `frontend/src/app/(protected)/dashboard/mapa/configurar/page.tsx`

**Mudanças:**
- Recebe `ambienteId` via query param
- Carrega apenas mesas daquele ambiente
- Botão "Adicionar Mesa" cria mesa no ambiente atual
- Salvar layout atualiza posições de todas as mesas

```typescript
export default function ConfiguradorMapaPage() {
  const searchParams = useSearchParams();
  const ambienteId = searchParams.get('ambienteId');
  
  // Carrega ambiente específico
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const [mesas, setMesas] = useState<MesaMapa[]>([]);
  
  useEffect(() => {
    if (ambienteId) {
      carregarAmbiente(ambienteId);
      carregarMesasDoAmbiente(ambienteId);
    }
  }, [ambienteId]);
  
  const adicionarMesa = async () => {
    // Cria mesa no backend
    const novaMesa = await mesaService.create({
      numero: proximoNumero,
      ambienteId: ambienteId,
      posicao: { x: 100, y: 100 }, // Posição inicial
      tamanho: { width: 80, height: 80 },
      rotacao: 0
    });
    
    // Adiciona ao estado local
    setMesas([...mesas, novaMesa]);
  };
  
  return (
    <RoleGuard allowedRoles={['ADMIN', 'GERENTE']}>
      {/* Header com nome do ambiente */}
      <div className="flex justify-between">
        <h1>Configurar Layout: {ambiente?.nome}</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.back()}>
            Voltar
          </Button>
          <Button onClick={adicionarMesa}>
            <Plus /> Adicionar Mesa
          </Button>
          <Button onClick={salvarLayout}>
            <Save /> Salvar Layout
          </Button>
        </div>
      </div>
      
      {/* Mapa com drag & drop */}
      <MapaConfigurador
        ambienteId={ambienteId}
        mesas={mesas}
        onMesaMove={handleMesaMove}
        onMesaRotate={handleMesaRotate}
        onMesaResize={handleMesaResize}
      />
    </RoleGuard>
  );
}
```

### 3. Backend - Endpoint Atualizado
**Arquivo:** `backend/src/modulos/mesa/mesa.controller.ts`

**Novo endpoint:**
```typescript
@Post()
@Roles(Cargo.ADMIN)
@ApiOperation({ summary: 'Cria mesa com posição inicial' })
create(@Body() createMesaDto: CreateMesaComPosicaoDto) {
  return this.mesaService.createComPosicao(createMesaDto);
}
```

**DTO atualizado:**
```typescript
export class CreateMesaComPosicaoDto {
  @IsNumber()
  numero: number;
  
  @IsUUID()
  ambienteId: string;
  
  @IsOptional()
  @ValidateNested()
  posicao?: PosicaoDto;
  
  @IsOptional()
  @ValidateNested()
  tamanho?: TamanhoDto;
  
  @IsOptional()
  @IsNumber()
  rotacao?: number;
}
```

---

## 🔄 Fluxo Completo Detalhado

### Cenário 1: Admin Configura Novo Ambiente

```
1. Admin → /dashboard/admin/ambientes
   └─ Clica "Adicionar Ambiente"
   └─ Preenche: nome="Varanda", tipo="ATENDIMENTO"
   └─ Salva ambiente

2. Admin → Clica "Configurar Layout" na Varanda
   └─ Redireciona para /dashboard/mapa/configurar?ambienteId={uuid}
   └─ Mapa vazio (nenhuma mesa ainda)

3. Admin → Clica "Adicionar Mesa" (5 vezes)
   └─ Mesa 1 criada em (100, 100)
   └─ Mesa 2 criada em (100, 100) - mesma posição inicial
   └─ Mesa 3 criada em (100, 100)
   └─ Mesa 4 criada em (100, 100)
   └─ Mesa 5 criada em (100, 100)

4. Admin → Arrasta mesas para posições
   └─ Mesa 1 → (50, 50)
   └─ Mesa 2 → (150, 50)
   └─ Mesa 3 → (250, 50)
   └─ Mesa 4 → (50, 150)
   └─ Mesa 5 → (150, 150)

5. Admin → Rotaciona Mesa 1 em 90°
   └─ Mesa 1 agora está vertical

6. Admin → Clica "Salvar Layout"
   └─ Backend atualiza posições de todas as 5 mesas
   └─ Toast: "Layout salvo com sucesso!"

7. Admin → Clica "Voltar"
   └─ Retorna para /dashboard/admin/ambientes
```

### Cenário 2: Admin Adiciona Mais Mesas a Ambiente Existente

```
1. Admin → /dashboard/admin/ambientes
   └─ Clica "Configurar Layout" no Salão Principal

2. Sistema → Carrega mapa com 10 mesas já posicionadas
   └─ Mesas 1-10 aparecem nas posições salvas

3. Admin → Clica "Adicionar Mesa" (3 vezes)
   └─ Mesa 11 criada em (100, 100)
   └─ Mesa 12 criada em (100, 100)
   └─ Mesa 13 criada em (100, 100)

4. Admin → Arrasta novas mesas
   └─ Mesa 11 → (350, 50)
   └─ Mesa 12 → (450, 50)
   └─ Mesa 13 → (550, 50)

5. Admin → Clica "Salvar Layout"
   └─ Backend atualiza apenas as 3 novas mesas
   └─ Mesas antigas mantêm posições

6. ✅ Ambiente agora tem 13 mesas posicionadas
```

### Cenário 3: Garçom Visualiza Mapa

```
1. Garçom → /garcom/mapa
   └─ Seleciona ambiente "Varanda"
   └─ Vê 5 mesas nas posições configuradas
   └─ Mesa 3 está vermelha (pedidos prontos)

2. Garçom → Clica na Mesa 3
   └─ Modal: "2 pedidos prontos de 5 total"
   └─ Clica "Ver Comanda"
   └─ Redireciona para comanda

3. ✅ Garçom entrega pedidos
```

---

## 📦 Componentes a Criar/Modificar

### Criar (Novos)
1. **`AmbienteSelector.tsx`**
   - Dropdown para selecionar ambiente
   - Usado no configurador e visualizador

2. **`BotaoAdicionarMesa.tsx`**
   - Botão flutuante no configurador
   - Cria mesa com número automático

### Modificar (Existentes)
1. **`ConfiguradorMapa.tsx`**
   - Adicionar prop `ambienteId`
   - Filtrar mesas por ambiente
   - Botão "Adicionar Mesa" integrado

2. **`MapaVisual.tsx`**
   - Adicionar prop `ambienteId`
   - Filtrar mesas por ambiente

3. **`/dashboard/admin/ambientes/page.tsx`**
   - Adicionar botão "Configurar Layout"

4. **`/dashboard/admin/mesas/page.tsx`** (OPCIONAL)
   - Simplificar para apenas listagem
   - Remover botão "Adicionar" (usar configurador)
   - Manter edição e exclusão

---

## 🗄️ Mudanças no Backend

### 1. Service - Criar Mesa com Posição
**Arquivo:** `backend/src/modulos/mesa/mesa.service.ts`

```typescript
async createComPosicao(dto: CreateMesaComPosicaoDto): Promise<Mesa> {
  // Verifica se ambiente existe
  const ambiente = await this.ambienteRepository.findOne({
    where: { id: dto.ambienteId }
  });
  
  if (!ambiente) {
    throw new NotFoundException('Ambiente não encontrado');
  }
  
  // Verifica número duplicado no mesmo ambiente
  const mesaExistente = await this.mesaRepository.findOne({
    where: { numero: dto.numero, ambiente: { id: dto.ambienteId } }
  });
  
  if (mesaExistente) {
    throw new ConflictException('Já existe uma mesa com este número neste ambiente');
  }
  
  // Cria mesa com posição
  const mesa = this.mesaRepository.create({
    numero: dto.numero,
    ambiente: { id: dto.ambienteId },
    posicao: dto.posicao || { x: 100, y: 100 },
    tamanho: dto.tamanho || { width: 80, height: 80 },
    rotacao: dto.rotacao || 0,
    status: MesaStatus.LIVRE
  });
  
  const mesaSalva = await this.mesaRepository.save(mesa);
  
  Logger.log(`Mesa ${mesa.numero} criada no ambiente ${ambiente.nome} com posição (${mesa.posicao.x}, ${mesa.posicao.y})`);
  
  return mesaSalva;
}
```

### 2. Endpoint - Listar Mesas por Ambiente
**Arquivo:** `backend/src/modulos/mesa/mesa.controller.ts`

```typescript
@Get('ambiente/:ambienteId')
@Roles(Cargo.ADMIN, Cargo.GERENTE, Cargo.GARCOM)
@ApiOperation({ summary: 'Lista mesas de um ambiente específico' })
@ApiResponse({ status: 200, description: 'Mesas do ambiente retornadas' })
findByAmbiente(@Param('ambienteId', ParseUUIDPipe) ambienteId: string) {
  return this.mesaService.findByAmbiente(ambienteId);
}
```

---

## 🎨 UI/UX Melhorias

### 1. Página de Ambientes
```
┌─────────────────────────────────────────────────────────┐
│ Gerenciamento de Ambientes                              │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Nome          │ Tipo        │ Mesas │ Ações         │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Salão Principal│ ATENDIMENTO │  10   │ ⚙️ Configurar │ │
│ │ Varanda       │ ATENDIMENTO │   5   │ ⚙️ Configurar │ │
│ │ Jardim        │ ATENDIMENTO │   8   │ ⚙️ Configurar │ │
│ │ Cozinha       │ PREPARO     │   0   │ ⚙️ Configurar │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2. Configurador de Mapa
```
┌─────────────────────────────────────────────────────────┐
│ Configurar Layout: Varanda                    [+ Mesa]  │
│                                               [💾 Salvar]│
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  [Mesa 1]    [Mesa 2]    [Mesa 3]                   │ │
│ │                                                      │ │
│ │                                                      │ │
│ │  [Mesa 4]    [Mesa 5]                               │ │
│ │                                                      │ │
│ │                                                      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Instruções:                                              │
│ • Arraste mesas para posicionar                          │
│ • Clique para rotacionar                                 │
│ • Redimensione pelos cantos                              │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar DTO `CreateMesaComPosicaoDto`
- [ ] Implementar `mesaService.createComPosicao()`
- [ ] Criar endpoint `GET /mesas/ambiente/:ambienteId`
- [ ] Atualizar endpoint `POST /mesas` para aceitar posição
- [ ] Adicionar validação de número duplicado por ambiente
- [ ] Testes unitários

### Frontend
- [ ] Refatorar `/dashboard/mapa/configurar` para receber `ambienteId`
- [ ] Criar componente `AmbienteSelector`
- [ ] Adicionar botão "Adicionar Mesa" no configurador
- [ ] Implementar lógica de numeração automática
- [ ] Atualizar `/dashboard/admin/ambientes` com botão "Configurar"
- [ ] Simplificar `/dashboard/admin/mesas` (opcional)
- [ ] Testes E2E

### Documentação
- [ ] Atualizar README com novo fluxo
- [ ] Criar guia de uso para admins
- [ ] Atualizar diagramas de rotas
- [ ] Documentar API no Swagger

---

## 🧪 Casos de Teste

### Teste 1: Criar Ambiente e Adicionar Mesas
```
1. Admin cria ambiente "Terraço"
2. Admin clica "Configurar Layout"
3. Admin adiciona 3 mesas
4. Admin posiciona mesas
5. Admin salva layout
6. ✅ Verificar: 3 mesas criadas com posições
```

### Teste 2: Adicionar Mesas a Ambiente Existente
```
1. Admin acessa configurador do "Salão"
2. Salão já tem 10 mesas
3. Admin adiciona 2 novas mesas
4. Admin posiciona novas mesas
5. Admin salva layout
6. ✅ Verificar: 12 mesas total, 10 antigas + 2 novas
```

### Teste 3: Garçom Visualiza Mapa por Ambiente
```
1. Garçom acessa /garcom/mapa
2. Garçom seleciona "Varanda"
3. ✅ Verificar: Apenas mesas da Varanda aparecem
4. Garçom seleciona "Salão"
5. ✅ Verificar: Apenas mesas do Salão aparecem
```

### Teste 4: Validação de Número Duplicado
```
1. Admin adiciona Mesa 5 na Varanda
2. Admin tenta adicionar outra Mesa 5 na Varanda
3. ❌ Erro: "Já existe uma mesa com este número"
4. Admin adiciona Mesa 5 no Salão
5. ✅ Sucesso: Números podem repetir em ambientes diferentes
```

---

## 📊 Impacto e Riscos

### Impacto Positivo
- ✅ Fluxo mais intuitivo
- ✅ Menos erros de configuração
- ✅ Melhor experiência do admin
- ✅ Redução de cliques
- ✅ Visão espacial desde o início

### Riscos
- ⚠️ Mesas antigas sem posição (migração necessária)
- ⚠️ Mudança no fluxo pode confundir usuários atuais
- ⚠️ Necessário treinamento/documentação

### Mitigação
- ✅ Manter página antiga de mesas como fallback
- ✅ Adicionar tooltips e guias no configurador
- ✅ Criar vídeo tutorial
- ✅ Migration para adicionar posição padrão em mesas antigas

---

## 🚀 Cronograma Sugerido

### Fase 1: Backend (1 dia)
- Criar DTO e service
- Implementar endpoints
- Testes unitários

### Fase 2: Frontend - Configurador (2 dias)
- Refatorar configurador
- Adicionar botão "Adicionar Mesa"
- Integrar com backend

### Fase 3: Frontend - Ambientes (1 dia)
- Adicionar botão "Configurar Layout"
- Criar seletor de ambiente
- Atualizar navegação

### Fase 4: Testes e Documentação (1 dia)
- Testes E2E
- Atualizar documentação
- Criar guia de uso

**Total: 5 dias**

---

## 📝 Notas Importantes

### Compatibilidade
- ✅ Mesas antigas continuam funcionando
- ✅ Página de gestão de mesas pode ser mantida
- ✅ Garçom não é afetado (usa mapa visual)

### Migração de Dados
```sql
-- Adicionar posição padrão em mesas sem posição
UPDATE mesas 
SET posicao = '{"x": 100, "y": 100}', 
    tamanho = '{"width": 80, "height": 80}',
    rotacao = 0
WHERE posicao IS NULL;
```

### Próximos Passos Após Refatoração
1. Adicionar templates de layout (ex: "Layout Restaurante")
2. Copiar layout entre ambientes
3. Importar/exportar layouts (JSON)
4. Histórico de alterações de layout

---

**Status:** 📋 PROPOSTA PRONTA PARA REVISÃO  
**Próxima Ação:** Revisar com equipe e aprovar implementação
