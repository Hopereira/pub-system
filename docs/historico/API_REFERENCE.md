# 📚 API Reference - Pub System

**Base URL:** `https://api.pubsystem.com.br` (produção) | `http://localhost:3000` (desenvolvimento)

**Autenticação:** Bearer Token (JWT)
```
Authorization: Bearer <token>
```

---

## 🔐 Auth

### POST /auth/login
Autentica um funcionário e retorna o token JWT.

**Request:**
```json
{
  "email": "admin@admin.com",
  "senha": "admin123"
}
```

**Response 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "funcionario": {
    "id": "uuid",
    "nome": "Admin",
    "email": "admin@admin.com",
    "cargo": "ADMIN"
  }
}
```

**Errors:**
- `401` - Credenciais inválidas

### GET /auth/profile
Retorna o perfil do usuário autenticado.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": "uuid",
  "nome": "Admin",
  "email": "admin@admin.com",
  "cargo": "ADMIN",
  "empresaId": "uuid"
}
```

---

## 🏢 Empresa

### GET /empresa
Retorna os dados da empresa.

**Response 200:**
```json
{
  "id": "uuid",
  "nome": "Pub Example",
  "cnpj": "12.345.678/0001-90",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua Example, 123",
  "logoUrl": "https://storage.googleapis.com/..."
}
```

### PATCH /empresa/:id
Atualiza dados da empresa.

**Request:**
```json
{
  "nome": "Novo Nome",
  "telefone": "(11) 88888-8888"
}
```

---

## 👥 Funcionários

### GET /funcionarios
Lista todos os funcionários.

**Query Params:**
- `cargo` (opcional): ADMIN, GERENTE, CAIXA, GARCOM, COZINHA
- `status` (opcional): ATIVO, INATIVO

**Response 200:**
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@pub.com",
    "cargo": "GARCOM",
    "status": "ATIVO",
    "criadoEm": "2025-01-01T00:00:00Z"
  }
]
```

### POST /funcionarios
Cria um novo funcionário. **Requer: ADMIN**

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@pub.com",
  "senha": "senha123",
  "cargo": "CAIXA"
}
```

### PATCH /funcionarios/:id
Atualiza um funcionário.

### DELETE /funcionarios/:id
Remove um funcionário.

---

## 🍽️ Mesas

### GET /mesas
Lista todas as mesas.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "numero": 1,
    "capacidade": 4,
    "status": "LIVRE",
    "ambienteId": "uuid",
    "ambiente": {
      "id": "uuid",
      "nome": "Salão Principal"
    }
  }
]
```

### GET /mesas/publico
Lista mesas sem autenticação (para clientes).

### POST /mesas
Cria uma nova mesa. **Requer: ADMIN, GERENTE**

**Request:**
```json
{
  "numero": 10,
  "capacidade": 6,
  "ambienteId": "uuid"
}
```

### PATCH /mesas/:id/status
Atualiza o status da mesa.

**Request:**
```json
{
  "status": "OCUPADA"
}
```

---

## 📋 Comandas

### GET /comandas
Lista comandas com filtros.

**Query Params:**
- `status`: ABERTA, FECHADA, PAGA
- `mesaId`: UUID da mesa
- `clienteId`: UUID do cliente

### GET /comandas/:id
Detalhes de uma comanda.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ABERTA",
  "mesa": { "id": "uuid", "numero": 5 },
  "cliente": { "id": "uuid", "nome": "Cliente" },
  "pedidos": [...],
  "total": 150.00,
  "criadoEm": "2025-01-01T12:00:00Z"
}
```

### GET /comandas/:id/public
Visualização pública (para QR Code).

### POST /comandas
Cria uma nova comanda.

**Request:**
```json
{
  "mesaId": "uuid",
  "clienteId": "uuid",
  "pontoEntregaId": "uuid"  // Opcional, alternativa à mesa
}
```

### POST /comandas/recuperar
Recupera comanda por ID ou CPF (endpoint público).

**Request:**
```json
{
  "comandaId": "uuid"
}
```
ou
```json
{
  "cpf": "123.456.789-00"
}
```

### PATCH /comandas/:id/fechar
Fecha uma comanda.

---

## 🛒 Pedidos

### GET /pedidos
Lista pedidos com filtros.

**Query Params:**
- `status`: FEITO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO
- `ambienteId`: UUID do ambiente
- `comandaId`: UUID da comanda

### POST /pedidos
Cria um novo pedido.

**Request:**
```json
{
  "comandaId": "uuid",
  "itens": [
    {
      "produtoId": "uuid",
      "quantidade": 2,
      "observacao": "Sem cebola"
    }
  ]
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "comandaId": "uuid",
  "status": "FEITO",
  "itens": [...],
  "criadoEm": "2025-01-01T12:00:00Z"
}
```

### PATCH /pedidos/:id/status
Atualiza status do pedido.

**Request:**
```json
{
  "status": "EM_PREPARO"
}
```

### PATCH /pedidos/item/:itemId/status
Atualiza status de um item específico.

**Request:**
```json
{
  "status": "PRONTO"
}
```

---

## 🍔 Produtos

### GET /produtos
Lista produtos.

**Query Params:**
- `categoriaId`: UUID da categoria
- `ambienteId`: UUID do ambiente de preparo
- `ativo`: true/false

**Response 200:**
```json
[
  {
    "id": "uuid",
    "nome": "Cerveja Heineken",
    "descricao": "Long neck 330ml",
    "preco": 12.90,
    "urlImagem": "https://...",
    "ambienteId": "uuid",
    "ativo": true
  }
]
```

### POST /produtos
Cria um produto. **Requer: ADMIN, GERENTE**

**Request (multipart/form-data):**
- `nome`: string
- `descricao`: string
- `preco`: number
- `ambienteId`: UUID
- `imagem`: File (opcional)

### PATCH /produtos/:id
Atualiza um produto.

### DELETE /produtos/:id
Remove um produto.

---

## 💰 Caixa

### POST /caixa/abertura
Abre o caixa do dia.

**Request:**
```json
{
  "valorInicial": 200.00,
  "observacao": "Abertura do dia"
}
```

### POST /caixa/fechamento
Fecha o caixa.

**Request:**
```json
{
  "valorInformadoDinheiro": 850.00,
  "valorInformadoPix": 450.00,
  "valorInformadoDebito": 300.00,
  "valorInformadoCredito": 200.00,
  "observacao": "Fechamento normal"
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "valorEsperadoDinheiro": 865.00,
  "valorInformadoDinheiro": 850.00,
  "diferencaDinheiro": -15.00,
  "totalVendas": 1800.00,
  "quantidadeVendas": 25,
  "ticketMedio": 72.00
}
```

### POST /caixa/sangria
Registra uma sangria.

**Request:**
```json
{
  "valor": 500.00,
  "motivo": "Pagamento de fornecedor",
  "autorizadoPor": "Gerente João"
}
```

### POST /caixa/suprimento
Registra um suprimento.

**Request:**
```json
{
  "valor": 100.00,
  "observacao": "Troco adicional"
}
```

### GET /caixa/resumo/:aberturaId
Resumo do caixa atual.

---

## ⏰ Turnos

### POST /turnos/checkin
Inicia um turno.

**Response 201:**
```json
{
  "id": "uuid",
  "funcionarioId": "uuid",
  "inicio": "2025-01-01T08:00:00Z",
  "status": "ATIVO"
}
```

### POST /turnos/checkout
Finaliza o turno.

**Response 200:**
```json
{
  "id": "uuid",
  "inicio": "2025-01-01T08:00:00Z",
  "fim": "2025-01-01T16:00:00Z",
  "horasTrabalhadas": 8
}
```

### GET /turnos/ativo
Retorna o turno ativo do funcionário logado.

---

## 📊 Analytics

### GET /analytics/geral
Relatório geral de vendas.

**Query Params:**
- `dataInicio`: YYYY-MM-DD
- `dataFim`: YYYY-MM-DD

**Response 200:**
```json
{
  "totalVendas": 15000.00,
  "quantidadePedidos": 150,
  "ticketMedio": 100.00,
  "produtosMaisVendidos": [...],
  "vendasPorDia": [...]
}
```

### GET /analytics/garcons
Performance dos garçons.

### GET /analytics/ambientes
Performance por ambiente de preparo.

---

## 🏆 Medalhas

### GET /medalhas/garcom/:id
Medalhas conquistadas pelo garçom.

### GET /medalhas/garcom/:id/progresso
Progresso das medalhas em andamento.

---

## 📍 Pontos de Entrega

### GET /pontos-entrega
Lista pontos de entrega.

### POST /pontos-entrega
Cria um ponto de entrega.

**Request:**
```json
{
  "nome": "Piscina",
  "descricao": "Área da piscina",
  "ambienteAtendimentoId": "uuid"
}
```

---

## 🌐 Ambientes

### GET /ambientes
Lista ambientes.

### GET /ambientes/publico
Lista ambientes sem autenticação.

### POST /ambientes
Cria um ambiente. **Requer: ADMIN**

**Request:**
```json
{
  "nome": "Cozinha",
  "tipo": "PREPARO"
}
```

---

## 📅 Eventos

### GET /eventos
Lista eventos.

### POST /eventos
Cria um evento.

**Request:**
```json
{
  "titulo": "Show ao Vivo",
  "descricao": "Banda XYZ",
  "dataInicio": "2025-02-01T20:00:00Z",
  "dataFim": "2025-02-02T02:00:00Z",
  "paginaEventoId": "uuid"
}
```

### PATCH /eventos/:id/upload
Upload de imagem do evento.

---

## ⭐ Avaliações

### POST /avaliacoes
Cria uma avaliação.

**Request:**
```json
{
  "comandaId": "uuid",
  "nota": 5,
  "comentario": "Excelente atendimento!"
}
```

### GET /avaliacoes
Lista avaliações.

---

## 🔧 Health Check

### GET /health
Verifica saúde da API.

**Response 200:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T12:00:00Z",
  "database": "connected"
}
```

---

## ❌ Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou ausente |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: email duplicado) |
| 422 | Unprocessable Entity - Validação falhou |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro interno |

**Formato de Erro:**
```json
{
  "statusCode": 400,
  "message": "Descrição do erro",
  "error": "Bad Request",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

*Documentação gerada em Dezembro 2025*
