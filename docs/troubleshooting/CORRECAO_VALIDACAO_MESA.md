# Correção: Validação de Mesa Duplicada com Mensagem Informativa

## 📋 Problema Identificado

Ao tentar criar uma mesa com número que já existe em outro ambiente, o sistema retornava um erro genérico sem informar em qual ambiente a mesa já estava cadastrada.

### Comportamento Anterior
```
❌ Erro: "Já existe uma mesa com este número neste ambiente."
```

**Problema**: A mensagem não informava qual ambiente continha a mesa duplicada, dificultando a resolução do problema.

## ✅ Solução Implementada

### Validação Prévia com Mensagem Informativa

**Arquivo**: `backend/src/modulos/mesa/mesa.service.ts`

Adicionada validação ANTES de tentar salvar a mesa, verificando se o número já existe em qualquer ambiente:

```typescript
// Verifica se já existe uma mesa com este número em qualquer ambiente
const mesaExistente = await this.mesaRepository.findOne({
  where: { numero },
  relations: ['ambiente'],
});

if (mesaExistente) {
  if (mesaExistente.ambiente.id === ambienteId) {
    throw new ConflictException(
      `A mesa ${numero} já existe no ambiente "${ambiente.nome}".`
    );
  } else {
    throw new ConflictException(
      `A mesa ${numero} já existe no ambiente "${mesaExistente.ambiente.nome}". Por favor, escolha outro número.`
    );
  }
}
```

### Comportamento Atual

#### Caso 1: Mesa já existe no MESMO ambiente
```json
{
  "statusCode": 409,
  "message": "A mesa 11 já existe no ambiente \"Salão Principal\"."
}
```

#### Caso 2: Mesa já existe em OUTRO ambiente
```json
{
  "statusCode": 409,
  "message": "A mesa 11 já existe no ambiente \"Varanda\". Por favor, escolha outro número."
}
```

## 🎯 Benefícios

1. **Mensagem Clara**: O usuário sabe exatamente qual ambiente já possui a mesa
2. **Melhor UX**: Orientação para escolher outro número
3. **Validação Prévia**: Evita tentativa de salvar no banco
4. **Código Limpo**: Tratamento de erro específico e informativo

## 📊 Fluxo de Validação

```
1. Usuário tenta criar Mesa 11 no "Salão Principal"
   ↓
2. Sistema verifica se Mesa 11 já existe
   ↓
3a. Se existe no MESMO ambiente:
    → Retorna: "A mesa 11 já existe no ambiente 'Salão Principal'."
   
3b. Se existe em OUTRO ambiente (ex: Varanda):
    → Retorna: "A mesa 11 já existe no ambiente 'Varanda'. Por favor, escolha outro número."
   
3c. Se NÃO existe:
    → Cria a mesa normalmente
```

## 🔧 Detalhes Técnicos

### Constraint no Banco
A entidade Mesa já possui uma constraint de unicidade:
```typescript
@Entity('mesas')
@Unique(['numero', 'ambiente'])
export class Mesa {
  // ...
}
```

Isso garante que **não pode haver duas mesas com o mesmo número no mesmo ambiente**, mas permite que ambientes diferentes tenham mesas com o mesmo número.

### Validação em Duas Camadas

1. **Validação Prévia** (Nova):
   - Verifica antes de tentar salvar
   - Fornece mensagem informativa
   - Indica qual ambiente possui a mesa

2. **Validação do Banco** (Existente):
   - Constraint `@Unique(['numero', 'ambiente'])`
   - Garante integridade dos dados
   - Fallback caso a validação prévia falhe

## 📝 Exemplo de Uso

### Frontend
Ao receber o erro 409, o frontend pode exibir:

```typescript
if (error.response?.status === 409) {
  toast.error(error.response.data.message);
  // Exemplo: "A mesa 11 já existe no ambiente 'Varanda'. 
  //           Por favor, escolha outro número."
}
```

### Teste Manual
```bash
# Criar mesa 11 no Salão Principal
curl -X POST http://localhost:3000/mesas \
  -H "Content-Type: application/json" \
  -d '{
    "numero": 11,
    "ambienteId": "uuid-salao-principal"
  }'

# Tentar criar mesa 11 novamente
# Resultado: Erro 409 com mensagem informativa
```

## ✨ Conclusão

A correção melhora significativamente a experiência do usuário ao fornecer mensagens de erro claras e acionáveis, indicando exatamente onde está o conflito e como resolvê-lo.

**Status**: ✅ **IMPLEMENTADO E TESTADO**

---

**Relacionado**:
- Issue #219 - Configurador de Layout de Mesas
- `CORRECAO_EMPRESA_SEEDER.md`
- `RESUMO_SESSAO_FINAL.md`
