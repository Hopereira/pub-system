# ✅ Implementação: Ambiente e Ponto de Entrega no Cliente Rápido

## 📋 Resumo da Funcionalidade

Quando o garçom cria um cliente rapidamente no sistema, agora é possível informar:
- **Ambiente**: Onde o cliente está localizado (ex: Salão, Varanda, Espaço VIP)
- **Ponto de Entrega**: Onde o cliente prefere receber o pedido (ex: Mesa 5, Balcão)

## 🔧 Mudanças Implementadas

### Backend

#### 1. **Entidade Cliente** (`cliente.entity.ts`)
```typescript
// ✅ NOVO: Relação com Ambiente
@Column({ name: 'ambiente_id', type: 'uuid', nullable: true })
ambienteId?: string;

@ManyToOne(() => Ambiente, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'ambiente_id' })
ambiente?: Ambiente;

// ✅ NOVO: Relação com Ponto de Entrega
@Column({ name: 'ponto_entrega_id', type: 'uuid', nullable: true })
pontoEntregaId?: string;

@ManyToOne(() => PontoEntrega, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'ponto_entrega_id' })
pontoEntrega?: PontoEntrega;
```

#### 2. **DTO CreateClienteRapidoDto**
```typescript
@ApiProperty({
  description: 'ID do ambiente onde o cliente está',
  example: 'uuid-do-ambiente',
  required: false,
})
@IsOptional()
@IsUUID('4', { message: 'ID do ambiente deve ser um UUID válido' })
ambienteId?: string;

@ApiProperty({
  description: 'ID do ponto de entrega preferido',
  example: 'uuid-do-ponto-entrega',
  required: false,
})
@IsOptional()
@IsUUID('4', { message: 'ID do ponto de entrega deve ser um UUID válido' })
pontoEntregaId?: string;
```

#### 3. **Service `cliente.service.ts`**
```typescript
const cliente = this.clienteRepository.create({
  nome: dto.nome,
  cpf: cpfFinal,
  celular: dto.telefone || null,
  email: null,
  ambienteId: dto.ambienteId || null, // ✅ NOVO
  pontoEntregaId: dto.pontoEntregaId || null, // ✅ NOVO
});
```

#### 4. **Migration `1731000000000-AddAmbienteEPontoEntregaToCliente.ts`**
- Adiciona colunas `ambiente_id` e `ponto_entrega_id` na tabela `clientes`
- Cria FKs para as tabelas `ambientes` e `pontos_entrega`
- Configura `ON DELETE SET NULL` (se ambiente/ponto for deletado, mantém o cliente)

---

### Frontend

#### 1. **Service `clienteService.ts`**
```typescript
export const criarClienteRapido = async (data: {
  nome: string;
  cpf?: string;
  telefone?: string;
  ambienteId?: string; // ✅ NOVO
  pontoEntregaId?: string; // ✅ NOVO
}): Promise<Cliente> => {
  // ...
};
```

#### 2. **Página `novo-pedido/page.tsx`**

**Estados adicionados:**
```typescript
const [ambienteRapido, setAmbienteRapido] = useState('');
const [pontoEntregaRapido, setPontoEntregaRapido] = useState('');
const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
const [pontosEntrega, setPontosEntrega] = useState<PontoEntrega[]>([]);
```

**Carregamento de dados:**
```typescript
const [produtosData, mesasData, ambientesData, pontosEntregaData] = await Promise.all([
  getProdutos(),
  getMesas(),
  getAmbientes(), // ✅ NOVO
  getPontosEntregaAtivos(), // ✅ NOVO
]);
```

**Formulário atualizado:**
```tsx
<select
  value={ambienteRapido}
  onChange={(e) => setAmbienteRapido(e.target.value)}
  className="w-full p-2 border rounded-lg"
>
  <option value="">Ambiente (opcional)</option>
  {ambientes.map((ambiente) => (
    <option key={ambiente.id} value={ambiente.id}>
      {ambiente.nome}
    </option>
  ))}
</select>

<select
  value={pontoEntregaRapido}
  onChange={(e) => setPontoEntregaRapido(e.target.value)}
  className="w-full p-2 border rounded-lg"
>
  <option value="">Ponto de Entrega (opcional)</option>
  {pontosEntrega.map((ponto) => (
    <option key={ponto.id} value={ponto.id}>
      {ponto.nome}
    </option>
  ))}
</select>
```

**Envio dos dados:**
```typescript
const novoCliente = await criarClienteRapido({
  nome: nomeRapido,
  telefone: telefoneRapido || undefined,
  ambienteId: ambienteRapido || undefined, // ✅ NOVO
  pontoEntregaId: pontoEntregaRapido || undefined, // ✅ NOVO
});
```

---

## 🚀 Como Aplicar

### 1. Rodar Migration
```powershell
# Entrar no container
docker exec -it pub_system_backend sh

# Executar migration
npm run migration:run

# Sair
exit
```

**Resultado esperado:**
```
Migration AddAmbienteEPontoEntregaToCliente1731000000000 has been executed successfully.
```

### 2. Verificar no Banco
```sql
-- Verificar se colunas foram adicionadas
\d clientes;

-- Deve mostrar:
-- ambiente_id         | uuid                        |           |
-- ponto_entrega_id    | uuid                        |           |

-- Verificar FKs
\d+ clientes;

-- Deve mostrar:
-- FK_clientes_ambiente
-- FK_clientes_ponto_entrega
```

### 3. Testar no Frontend

1. **Acesse:** http://localhost:3001/garcom/novo-pedido
2. **Clique:** "Criar Cliente Rápido"
3. **Preencha:**
   - Nome: `João Silva`
   - Telefone: `11987654321` (opcional)
   - **Ambiente:** Selecione um ambiente (ex: Salão)
   - **Ponto de Entrega:** Selecione um ponto (ex: Mesa 5)
4. **Clique:** "Criar"

**Resultado esperado:**
- ✅ Cliente criado com sucesso
- ✅ Toast de confirmação
- ✅ Cliente selecionado automaticamente
- ✅ Dados salvos no banco com `ambiente_id` e `ponto_entrega_id` preenchidos

---

## 🧪 Testes

### Teste 1: Criar cliente SEM ambiente/ponto
```http
POST http://localhost:3001/clientes/rapido
Content-Type: application/json

{
  "nome": "Maria Santos",
  "telefone": "11999998888"
}
```

**Resultado:** Cliente criado com `ambiente_id` e `ponto_entrega_id` = `NULL`

### Teste 2: Criar cliente COM ambiente e ponto
```http
POST http://localhost:3001/clientes/rapido
Content-Type: application/json

{
  "nome": "Pedro Oliveira",
  "telefone": "11988887777",
  "ambienteId": "uuid-ambiente-salao",
  "pontoEntregaId": "uuid-ponto-mesa-5"
}
```

**Resultado:** Cliente criado com IDs preenchidos

### Teste 3: Validar UUID inválido
```http
POST http://localhost:3001/clientes/rapido
Content-Type: application/json

{
  "nome": "Ana Costa",
  "ambienteId": "not-a-uuid"
}
```

**Resultado:** 
```json
{
  "statusCode": 400,
  "message": ["ID do ambiente deve ser um UUID válido"],
  "error": "Bad Request"
}
```

### Teste 4: Query de verificação
```sql
SELECT 
  c.id,
  c.nome,
  c.celular,
  c.ambiente_id,
  a.nome as ambiente_nome,
  c.ponto_entrega_id,
  pe.nome as ponto_entrega_nome
FROM clientes c
LEFT JOIN ambientes a ON c.ambiente_id = a.id
LEFT JOIN pontos_entrega pe ON c.ponto_entrega_id = pe.id
WHERE c.nome LIKE '%João%'
ORDER BY c.criado_em DESC
LIMIT 5;
```

---

## 📊 Benefícios

1. **Melhor Rastreamento**: Sabe exatamente onde cada cliente está
2. **Entrega Mais Rápida**: Garçom sabe para onde levar o pedido
3. **Analytics Precisos**: Relatórios por ambiente/ponto de entrega
4. **UX Aprimorado**: Menos perguntas ao cliente, mais automação

---

## ✅ Checklist de Validação

- [x] DTO atualizado com validação UUID
- [x] Entidade Cliente com relações ManyToOne
- [x] Service aceita novos campos
- [x] Migration criada
- [ ] Migration executada
- [x] Frontend com selects de ambiente/ponto
- [x] Service frontend atualizado
- [x] Formulário visual completo
- [ ] Testes end-to-end

---

## 🎯 Resultado Final

### Antes (3 campos)
```typescript
{
  nome: "João Silva",
  telefone: "11987654321",
  cpf: "12345678900"
}
```

### Depois (5 campos) ✅
```typescript
{
  nome: "João Silva",
  telefone: "11987654321",
  cpf: "12345678900",
  ambienteId: "uuid-salao", // ✅ NOVO
  pontoEntregaId: "uuid-mesa-5" // ✅ NOVO
}
```

**Garçom agora sabe:**
- ✅ Quem é o cliente (nome)
- ✅ Como contatar (telefone)
- ✅ **Onde ele está** (ambiente)
- ✅ **Onde entregar** (ponto de entrega)

🎉 **Sistema mais completo e eficiente!**
