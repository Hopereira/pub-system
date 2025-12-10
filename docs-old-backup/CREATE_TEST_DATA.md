# 🧪 Criar Dados de Teste para o Sistema

## Problema Identificado
O seeder atual só cria:
- ✅ Ambientes (8)
- ✅ Mesas (22)
- ✅ Produtos (42)

**Falta criar:**
- ❌ Clientes
- ❌ Comandas abertas

Por isso a busca no Terminal de Caixa não encontra nada!

## Solução: Criar Cliente e Comanda de Teste

### Opção 1: Via Interface (Recomendado)

1. **Acesse**: http://localhost:3001/entrada/[eventoId]?mesaId=1
   - Ou crie um evento primeiro em: `/dashboard/admin/agenda-eventos/novo`
   
2. **Preencha o formulário**:
   - Nome: `Cliente Teste`
   - CPF: `12345678900`
   - Email: `teste@teste.com`
   
3. **Isso criará automaticamente**:
   - ✅ Cliente
   - ✅ Comanda aberta
   - ✅ Associada à mesa

### Opção 2: Via Comando Direto

Execute no terminal dentro do container do backend:

```bash
# Criar um cliente
docker-compose exec backend npm run typeorm -- query "INSERT INTO clientes (nome, cpf, email) VALUES ('Cliente Teste', '12345678900', 'teste@teste.com') RETURNING *"

# Depois criar uma comanda (substituir [cliente_id] e [mesa_id])
# Você precisará dos IDs retornados do comando anterior
```

## Como Testar Depois

1. **Acesse**: http://localhost:3001/dashboard/operacional/caixa
2. **Busque por**:
   - Nome: `teste`
   - CPF: `123` ou `12345678900`
   - Mesa: `1`

## Como Fechar uma Comanda

1. **Encontre a comanda** no Terminal de Caixa
2. **Clique no card** da comanda
3. **Será redirecionado** para `/dashboard/comandas/[id]`
4. **Clique no botão** "Fechar Comanda"
5. **Confirme** o fechamento

A comanda será fechada e a mesa liberada automaticamente!
