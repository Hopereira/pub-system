# Melhoria de UX: Escolha Interativa do Número da Mesa

## 📋 Problema Identificado

Quando o usuário tentava criar uma mesa no configurador de layout e o número já existia em outro ambiente, o sistema apenas mostrava um erro no backend:

```
[Nest] 51  - 11/12/2025, 2:51:31 AM   ERROR [HTTP] ❌ ERRO: POST /mesas | 
A mesa 11 já existe no ambiente "Varanda". Por favor, escolha outro número. | Tempo: 27ms
```

**Problema**: O usuário não tinha como "escolher outro número" facilmente - precisava cancelar, voltar, e tentar adivinhar qual número estava disponível.

## ✅ Solução Implementada

### 1. **Prompt ao Adicionar Nova Mesa**

Agora, ao clicar em "Nova Mesa", o usuário vê um prompt pedindo o número:

```
Digite o número da nova mesa.

Sugestão: 11

Observação: O número deve ser único dentro deste ambiente.
```

**Benefícios**:
- ✅ Usuário escolhe o número antes de adicionar
- ✅ Sugestão automática do próximo número disponível
- ✅ Validação local antes de salvar

### 2. **Validação Local**

Antes de adicionar a mesa, o sistema verifica:
- ✅ Número é válido (positivo e numérico)
- ✅ Número não existe no ambiente atual

```typescript
const numero = parseInt(numeroEscolhido, 10);
if (isNaN(numero) || numero <= 0) {
  toast.error('Número inválido. Por favor, digite um número positivo.');
  return;
}

// Verificar se já existe mesa com este número no ambiente atual
if (numerosMesas.includes(numero)) {
  toast.error(`A mesa ${numero} já existe neste ambiente. Por favor, escolha outro número.`);
  return;
}
```

### 3. **Recuperação Interativa de Erros**

Se ao salvar o layout houver erro de mesa duplicada em OUTRO ambiente, o sistema:

1. Mostra a mensagem de erro clara
2. Pergunta ao usuário se quer escolher outro número
3. Tenta criar novamente com o novo número

```typescript
if (axiosError.response?.status === 409) {
  const mensagemErro = axiosError.response.data?.message || `A mesa ${mesa.numero} já existe.`;
  toast.error(mensagemErro);
  
  // Perguntar se o usuário quer escolher outro número
  const novoNumero = window.prompt(
    `${mensagemErro}\n\n` +
    `Digite um novo número para esta mesa:`,
    (mesa.numero + 1).toString()
  );
  
  if (novoNumero) {
    const numeroInt = parseInt(novoNumero, 10);
    if (!isNaN(numeroInt) && numeroInt > 0) {
      // Tentar criar novamente com o novo número
      const novaMesa = await createMesa({
        numero: numeroInt,
        ambienteId: ambienteId,
        posicao: mesa.posicao,
        tamanho: mesa.tamanho,
        rotacao: mesa.rotacao,
      });
      // ...
    }
  }
}
```

## 📊 Fluxo de UX Melhorado

### Cenário 1: Adicionar Mesa com Sucesso

```
1. Usuário clica em "Nova Mesa"
   ↓
2. Sistema mostra prompt: "Digite o número da nova mesa. Sugestão: 11"
   ↓
3. Usuário digita "11" e confirma
   ↓
4. Sistema valida localmente (OK)
   ↓
5. Mesa 11 adicionada ao mapa
   ↓
6. Usuário posiciona a mesa
   ↓
7. Usuário clica em "Salvar Layout"
   ↓
8. Sistema cria mesa no backend
   ↓
9. ✅ Sucesso! "Layout salvo com sucesso!"
```

### Cenário 2: Número Já Existe no Ambiente Atual

```
1. Usuário clica em "Nova Mesa"
   ↓
2. Sistema mostra prompt: "Digite o número da nova mesa. Sugestão: 11"
   ↓
3. Usuário digita "1" (já existe)
   ↓
4. Sistema valida localmente
   ↓
5. ❌ Erro: "A mesa 1 já existe neste ambiente. Por favor, escolha outro número."
   ↓
6. Usuário pode tentar novamente
```

### Cenário 3: Número Já Existe em Outro Ambiente

```
1. Usuário clica em "Nova Mesa"
   ↓
2. Sistema mostra prompt: "Digite o número da nova mesa. Sugestão: 12"
   ↓
3. Usuário digita "11" (existe na Varanda, mas não no Salão)
   ↓
4. Sistema valida localmente (OK - não existe no Salão)
   ↓
5. Mesa 11 adicionada ao mapa
   ↓
6. Usuário posiciona a mesa
   ↓
7. Usuário clica em "Salvar Layout"
   ↓
8. Sistema tenta criar mesa no backend
   ↓
9. ❌ Backend retorna erro 409: "A mesa 11 já existe no ambiente 'Varanda'"
   ↓
10. Sistema mostra prompt: "A mesa 11 já existe no ambiente 'Varanda'. Digite um novo número: [12]"
    ↓
11. Usuário digita "12" e confirma
    ↓
12. Sistema tenta criar novamente com número 12
    ↓
13. ✅ Sucesso! Mesa criada com número 12
    ↓
14. ✅ "Layout salvo com sucesso!"
```

## 🎯 Benefícios da Solução

### 1. **Prevenção de Erros**
- Validação local antes de adicionar
- Sugestão automática de número disponível
- Feedback imediato

### 2. **Recuperação de Erros**
- Usuário pode corrigir sem perder o trabalho
- Não precisa cancelar e recomeçar
- Mensagens claras e acionáveis

### 3. **Flexibilidade**
- Usuário escolhe o número que preferir
- Pode usar numeração personalizada
- Sugestão inteligente do próximo número

### 4. **Experiência Fluida**
- Menos cliques
- Menos frustração
- Processo mais intuitivo

## 📝 Código Modificado

**Arquivo**: `frontend/src/components/mapa/ConfiguradorMapa.tsx`

### Método `adicionarMesa`
```typescript
const adicionarMesa = () => {
  if (!mapa) return;

  // Gerar número da nova mesa (apenas do ambiente atual)
  const numerosMesas = mapa.mesas.map(m => m.numero);
  const proximoNumero = Math.max(...numerosMesas, 0) + 1;

  // Solicitar número da mesa ao usuário
  const numeroEscolhido = window.prompt(
    `Digite o número da nova mesa.\n\n` +
    `Sugestão: ${proximoNumero}\n\n` +
    `Observação: O número deve ser único dentro deste ambiente.`,
    proximoNumero.toString()
  );

  if (!numeroEscolhido) {
    return; // Usuário cancelou
  }

  const numero = parseInt(numeroEscolhido, 10);
  if (isNaN(numero) || numero <= 0) {
    toast.error('Número inválido. Por favor, digite um número positivo.');
    return;
  }

  // Verificar se já existe mesa com este número no ambiente atual
  if (numerosMesas.includes(numero)) {
    toast.error(`A mesa ${numero} já existe neste ambiente. Por favor, escolha outro número.`);
    return;
  }

  // Criar nova mesa temporária...
};
```

### Método `salvarLayout` - Tratamento de Erro
```typescript
catch (error) {
  const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
  if (axiosError.response?.status === 409) {
    const mensagemErro = axiosError.response.data?.message || `A mesa ${mesa.numero} já existe.`;
    toast.error(mensagemErro);
    
    // Perguntar se o usuário quer escolher outro número
    const novoNumero = window.prompt(
      `${mensagemErro}\n\n` +
      `Digite um novo número para esta mesa:`,
      (mesa.numero + 1).toString()
    );
    
    if (novoNumero) {
      const numeroInt = parseInt(novoNumero, 10);
      if (!isNaN(numeroInt) && numeroInt > 0) {
        // Tentar criar novamente com o novo número
        const novaMesa = await createMesa({
          numero: numeroInt,
          ambienteId: ambienteId,
          posicao: mesa.posicao,
          tamanho: mesa.tamanho,
          rotacao: mesa.rotacao,
        });
        // ...
      }
    }
  }
}
```

## 🧪 Teste Manual

### Teste 1: Adicionar Mesa com Número Sugerido
1. Acessar configurador de layout
2. Clicar em "Nova Mesa"
3. Aceitar número sugerido (Enter)
4. Posicionar mesa
5. Salvar layout
6. ✅ Resultado: Mesa criada com sucesso

### Teste 2: Adicionar Mesa com Número Personalizado
1. Acessar configurador de layout
2. Clicar em "Nova Mesa"
3. Digitar "99" e confirmar
4. Posicionar mesa
5. Salvar layout
6. ✅ Resultado: Mesa 99 criada com sucesso

### Teste 3: Tentar Número Duplicado no Mesmo Ambiente
1. Acessar configurador de layout
2. Clicar em "Nova Mesa"
3. Digitar "1" (já existe)
4. ❌ Resultado: Erro "A mesa 1 já existe neste ambiente"
5. Tentar novamente com número diferente
6. ✅ Resultado: Mesa criada com sucesso

### Teste 4: Número Duplicado em Outro Ambiente
1. Acessar configurador do Salão
2. Clicar em "Nova Mesa"
3. Digitar "11" (existe na Varanda)
4. Posicionar mesa
5. Salvar layout
6. Sistema detecta duplicata
7. Prompt: "A mesa 11 já existe no ambiente 'Varanda'. Digite um novo número:"
8. Digitar "12"
9. ✅ Resultado: Mesa 12 criada com sucesso

## ✨ Conclusão

A melhoria de UX transforma uma mensagem de erro frustrante em uma experiência interativa e útil. O usuário agora tem controle total sobre a numeração das mesas e pode corrigir erros sem perder o trabalho.

**Antes**: ❌ Erro → Cancelar → Recomeçar  
**Depois**: ✅ Erro → Escolher novo número → Continuar

**Status**: ✅ **IMPLEMENTADO E TESTADO**

---

**Relacionado**:
- `CORRECAO_VALIDACAO_MESA.md` - Validação de mesa duplicada no backend
- `CORRECAO_MESAS_TEMPORARIAS.md` - Criação de mesas temporárias
- Issue #219 - Configurador de Layout de Mesas
