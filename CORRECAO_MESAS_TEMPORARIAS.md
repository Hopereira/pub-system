# Correção: Criação de Mesas Temporárias no Configurador de Layout

## 📋 Problema Identificado

Ao adicionar uma nova mesa no configurador de layout e tentar salvar, o sistema retornava erro 400:

```
Failed to load resource: the server responded with a status of 400 (Bad Request)
PUT /mesas/temp-1762915312871/posicao
```

### Causa Raiz

O configurador criava mesas com IDs temporários (`temp-{timestamp}`), mas ao salvar o layout, tentava atualizar a posição dessas mesas que não existiam no banco de dados.

## ✅ Solução Implementada

### Fluxo Corrigido

**Antes**:
1. Usuário adiciona nova mesa → Cria com ID temporário
2. Usuário clica em "Salvar Layout"
3. Sistema tenta atualizar posição de TODAS as mesas
4. ❌ Erro: Mesa com ID temporário não existe no banco

**Depois**:
1. Usuário adiciona nova mesa → Cria com ID temporário
2. Usuário clica em "Salvar Layout"
3. Sistema cria mesas temporárias no backend PRIMEIRO
4. Sistema substitui IDs temporários por IDs reais
5. Sistema atualiza posições de todas as mesas
6. ✅ Sucesso!

### Código Modificado

**Arquivo**: `frontend/src/components/mapa/ConfiguradorMapa.tsx`

#### 1. Adicionado Import
```typescript
import { createMesa } from '@/services/mesaService';
```

#### 2. Método `salvarLayout` Refatorado

```typescript
const salvarLayout = async () => {
  if (!mapa || !ambienteId) return;

  try {
    setSalvando(true);

    // 1. Primeiro, criar mesas temporárias no backend
    const mesasAtualizadas = [...mapa.mesas];
    for (let i = 0; i < mesasAtualizadas.length; i++) {
      const mesa = mesasAtualizadas[i];
      
      // Se é uma mesa temporária, criar no backend primeiro
      if (mesa.id.startsWith('temp-')) {
        try {
          const novaMesa = await createMesa({
            numero: mesa.numero,
            ambienteId: ambienteId,
            posicao: mesa.posicao,
            tamanho: mesa.tamanho,
            rotacao: mesa.rotacao,
          });
          
          // Substituir ID temporário pelo ID real
          mesasAtualizadas[i] = {
            ...mesa,
            id: novaMesa.id,
          };
          
          console.log(`✅ Mesa ${mesa.numero} criada com ID: ${novaMesa.id}`);
        } catch (error) {
          // Se der erro de mesa duplicada, mostrar mensagem específica
          const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
          if (axiosError.response?.status === 409) {
            toast.error(axiosError.response.data?.message || `Erro ao criar mesa ${mesa.numero}`);
          } else {
            toast.error(`Erro ao criar mesa ${mesa.numero}`);
          }
          throw error;
        }
      }
    }

    // Atualizar estado com IDs reais
    setMapa({
      ...mapa,
      mesas: mesasAtualizadas,
    });

    // 2. Depois, atualizar posição de todas as mesas (agora todas têm ID real)
    for (const mesa of mesasAtualizadas) {
      if (mesa.posicao && !mesa.id.startsWith('temp-')) {
        await mapaService.atualizarPosicaoMesa(mesa.id, {
          posicao: mesa.posicao,
          tamanho: mesa.tamanho,
          rotacao: mesa.rotacao,
        });
      }
    }

    // 3. Salvar posição de cada ponto
    for (const ponto of mapa.pontosEntrega) {
      if (ponto.posicao) {
        await mapaService.atualizarPosicaoPonto(ponto.id, {
          posicao: ponto.posicao,
          tamanho: ponto.tamanho,
        });
      }
    }

    toast.success('Layout salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar layout:', error);
    toast.error('Erro ao salvar layout');
  } finally {
    setSalvando(false);
  }
};
```

## 🎯 Benefícios

### 1. **Criação Automática**
Mesas temporárias são automaticamente criadas no backend ao salvar o layout.

### 2. **Validação de Duplicatas**
Se tentar criar uma mesa com número que já existe, o sistema mostra mensagem clara:
```
"A mesa 11 já existe no ambiente 'Varanda'. Por favor, escolha outro número."
```

### 3. **IDs Reais**
Após salvar, todas as mesas têm IDs reais do banco de dados, permitindo operações futuras.

### 4. **Tratamento de Erros**
Erros específicos (como mesa duplicada) são tratados e exibidos ao usuário.

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────┐
│ Usuário Adiciona Nova Mesa             │
│ • Número: 11                            │
│ • ID: temp-1762915312871                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Usuário Arrasta e Posiciona            │
│ • Posição: {x: 200, y: 300}            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Usuário Clica em "Salvar Layout"       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Sistema Verifica Mesas Temporárias      │
│ • Encontra: temp-1762915312871          │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ Sistema Cria Mesa no Backend            │
│ POST /mesas                             │
│ {                                       │
│   numero: 11,                           │
│   ambienteId: "uuid-salao",             │
│   posicao: {x: 200, y: 300}             │
│ }                                       │
└─────────────────┬───────────────────────┘
                  │
                  ├─── ✅ Sucesso
                  │    │
                  │    ▼
                  │   ┌─────────────────────────────┐
                  │   │ Mesa Criada com ID Real     │
                  │   │ ID: "uuid-real-da-mesa"     │
                  │   └─────────────┬───────────────┘
                  │                 │
                  │                 ▼
                  │   ┌─────────────────────────────┐
                  │   │ Substitui ID Temporário     │
                  │   │ temp-xxx → uuid-real        │
                  │   └─────────────┬───────────────┘
                  │                 │
                  │                 ▼
                  │   ┌─────────────────────────────┐
                  │   │ Atualiza Posições           │
                  │   │ PUT /mesas/{id}/posicao     │
                  │   └─────────────┬───────────────┘
                  │                 │
                  │                 ▼
                  │   ┌─────────────────────────────┐
                  │   │ ✅ Layout Salvo!            │
                  │   └─────────────────────────────┘
                  │
                  └─── ❌ Erro (Mesa Duplicada)
                       │
                       ▼
                      ┌─────────────────────────────┐
                      │ Mostra Mensagem Clara       │
                      │ "A mesa 11 já existe no     │
                      │  ambiente 'Varanda'"        │
                      └─────────────────────────────┘
```

## 🧪 Teste Manual

### Cenário 1: Criar Nova Mesa com Sucesso
1. Acessar `/dashboard/mapa/configurar?ambienteId={id}`
2. Clicar em "Nova Mesa"
3. Arrastar mesa para posição desejada
4. Clicar em "Salvar Layout"
5. ✅ Resultado: Mesa criada com sucesso

### Cenário 2: Tentar Criar Mesa Duplicada
1. Acessar `/dashboard/mapa/configurar?ambienteId={id}`
2. Clicar em "Nova Mesa" (número 11)
3. Clicar em "Salvar Layout"
4. ❌ Resultado: Erro "A mesa 11 já existe no ambiente 'Varanda'"

### Cenário 3: Criar Múltiplas Mesas
1. Acessar `/dashboard/mapa/configurar?ambienteId={id}`
2. Clicar em "Nova Mesa" 3 vezes
3. Posicionar as 3 mesas
4. Clicar em "Salvar Layout"
5. ✅ Resultado: Todas as 3 mesas criadas com sucesso

## 📝 Arquivos Modificados

1. **`frontend/src/components/mapa/ConfiguradorMapa.tsx`**
   - Adicionado import de `createMesa`
   - Refatorado método `salvarLayout`
   - Adicionado tratamento de erros específico

2. **`backend/src/modulos/mesa/mesa.service.ts`** (Correção Anterior)
   - Validação de mesa duplicada com mensagem informativa

## ✨ Conclusão

A correção garante que:
- ✅ Mesas temporárias são criadas no backend antes de atualizar posições
- ✅ IDs temporários são substituídos por IDs reais
- ✅ Mensagens de erro são claras e informativas
- ✅ Numeração por ambiente funciona corretamente
- ✅ Sistema não tenta atualizar mesas inexistentes

**Status**: ✅ **IMPLEMENTADO E TESTADO**

---

**Relacionado**:
- `CORRECAO_VALIDACAO_MESA.md` - Validação de mesa duplicada
- `CORRECAO_EMPRESA_SEEDER.md` - Empresa padrão no seeder
- Issue #219 - Configurador de Layout de Mesas
