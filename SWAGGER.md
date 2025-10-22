# 📚 Documentação Swagger - Pub System API

## ✅ Swagger Configurado e Funcional

A documentação interativa Swagger está **100% implementada** e acessível em:

**URL:** `http://localhost:3000/api`

---

## 🎯 O que foi implementado

### Configuração Base (main.ts)
✅ DocumentBuilder com título, descrição e versão  
✅ Bearer Authentication configurado  
✅ Endpoint `/api` para acessar a documentação  
✅ Swagger UI configurado e funcional

### Controllers Documentados

Todos os 11 controllers possuem documentação completa:

#### 1. **Autenticação** (`@ApiTags('Autenticação')`)
- ✅ POST `/auth/login` - Login com JWT

#### 2. **Empresa** (`@ApiTags('Empresa')`)
- ✅ POST `/empresa` - Criar empresa
- ✅ GET `/empresa` - Buscar empresa
- ✅ PATCH `/empresa/:id` - Atualizar empresa

#### 3. **Ambientes** (`@ApiTags('Ambientes')`)
- ✅ CRUD completo de ambientes
- ✅ Tipos: PREPARO e ATENDIMENTO
- ✅ Apenas ADMIN

#### 4. **Funcionários** (`@ApiTags('Funcionários')`)
- ✅ CRUD completo de funcionários
- ✅ Roles: ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO
- ✅ Apenas ADMIN

#### 5. **Mesas** (`@ApiTags('Mesas')`)
- ✅ CRUD completo de mesas
- ✅ Status: LIVRE, OCUPADA, RESERVADA
- ✅ Vinculadas a ambientes

#### 6. **Clientes** (`@ApiTags('Clientes')`)
- ✅ POST `/clientes` - Criar cliente (PÚBLICO)
- ✅ GET `/clientes` - Listar clientes (ADMIN)
- ✅ GET `/clientes/by-cpf` - Buscar por CPF (PÚBLICO)
- ✅ CRUD completo

#### 7. **Comandas** (`@ApiTags('Comandas')`)
- ✅ POST `/comandas` - Criar comanda (PÚBLICO)
- ✅ GET `/comandas/search` - Buscar comandas (ADMIN/CAIXA)
- ✅ GET `/comandas/:id/public` - Visualização pública (QR Code)
- ✅ PATCH `/comandas/:id/fechar` - Fechar comanda
- ✅ Status: ABERTA, FECHADA, PAGA

#### 8. **Produtos** (`@ApiTags('Produtos')`)
- ✅ POST `/produtos` - Criar com upload de imagem
- ✅ GET `/produtos` - Listar produtos (PÚBLICO)
- ✅ PATCH `/produtos/:id` - Atualizar com imagem opcional
- ✅ DELETE `/produtos/:id` - Remover
- ✅ Upload via multipart/form-data

#### 9. **Pedidos** (`@ApiTags('Pedidos')`)
- ✅ POST `/pedidos` - Criar pedido (ADMIN/GARCOM)
- ✅ POST `/pedidos/cliente` - Criar pedido (PÚBLICO)
- ✅ PATCH `/pedidos/item/:itemPedidoId/status` - Atualizar status de item
- ✅ GET `/pedidos` - Listar com filtro por ambiente
- ✅ Status: FEITO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO

#### 10. **Eventos** (`@ApiTags('Eventos')`)
- ✅ CRUD completo de eventos
- ✅ PATCH `/eventos/:id/upload` - Upload de imagem
- ✅ GET `/eventos/publicos` - Listar eventos públicos
- ✅ GET `/eventos/publicos/:id` - Buscar evento público

#### 11. **Páginas de Evento** (`@ApiTags('Páginas de Evento')`)
- ✅ CRUD completo de landing pages
- ✅ PATCH `/paginas-evento/:id/upload-media` - Upload de mídia
- ✅ GET `/paginas-evento/ativa/publica` - Página ativa (PÚBLICO)
- ✅ GET `/paginas-evento/:id/public` - Página pública por ID

---

## 🔐 Autenticação no Swagger

### Como usar Bearer Token:

1. Acesse `http://localhost:3000/api`
2. Faça login via endpoint `POST /auth/login`:
   ```json
   {
     "email": "admin@admin.com",
     "senha": "admin123"
   }
   ```
3. Copie o `access_token` da resposta
4. Clique no botão **"Authorize"** 🔒 no topo da página
5. Cole o token no campo (formato: `Bearer SEU_TOKEN_AQUI`)
6. Clique em **"Authorize"** e depois **"Close"**
7. Todas as rotas protegidas estarão acessíveis!

---

## 📋 Decoradores Implementados

### Por Controller
- `@ApiTags()` - Agrupa endpoints por módulo
- `@ApiBearerAuth()` - Indica autenticação JWT necessária

### Por Endpoint
- `@ApiOperation()` - Descrição resumida do endpoint
- `@ApiResponse()` - Respostas possíveis (200, 201, 400, 404, etc.)
- `@ApiConsumes()` - Tipo de conteúdo (multipart/form-data para uploads)

---

## 🎨 Recursos do Swagger UI

### ✅ O que você pode fazer:

1. **Explorar Todos os Endpoints**
   - Visualizar todos os métodos HTTP disponíveis
   - Ver parâmetros obrigatórios e opcionais
   - Entender estrutura de DTOs

2. **Testar Requisições**
   - Fazer chamadas direto pela interface
   - Ver resposta em tempo real
   - Testar autenticação JWT

3. **Validar Dados**
   - Ver esquemas de validação (Zod/class-validator)
   - Exemplos de payloads corretos
   - Tipos TypeScript visualizados

4. **Upload de Arquivos**
   - Testar upload de imagens/vídeos
   - Ver limitações de tamanho e tipo
   - Validar multipart/form-data

---

## 📊 Estatísticas

### Endpoints Documentados
- **Total:** 50+ endpoints
- **Públicos:** 10 endpoints (sem autenticação)
- **Protegidos:** 40+ endpoints (JWT obrigatório)

### Roles de Acesso
- **ADMIN:** Acesso total (todos endpoints)
- **GERENTE:** Gestão operacional
- **CAIXA:** Terminal de caixa e comandas
- **GARCOM:** Pedidos e atendimento
- **COZINHA:** Painéis de preparo

### Status HTTP Documentados
- ✅ `200` - Sucesso
- ✅ `201` - Criado
- ✅ `400` - Bad Request (validação)
- ✅ `401` - Não autenticado
- ✅ `403` - Sem permissão (role inadequada)
- ✅ `404` - Não encontrado
- ✅ `409` - Conflito (duplicata)

---

## 🚀 Como Acessar

### 1. Inicie o Backend
```powershell
docker-compose up -d backend
# ou
cd backend
npm run start:dev
```

### 2. Acesse o Swagger
Abra no navegador: **http://localhost:3000/api**

### 3. Explore a Documentação
- Navegue pelos controllers
- Expanda endpoints para ver detalhes
- Teste rotas públicas sem autenticação
- Autentique-se para testar rotas protegidas

---

## 🔍 Exemplos de Uso

### Criar um Cliente (Rota Pública)
```bash
POST http://localhost:3000/clientes
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678900",
  "celular": "21999999999"
}
```

### Criar um Produto com Imagem (Admin)
```bash
POST http://localhost:3000/produtos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: multipart/form-data

imagemFile: [arquivo.jpg]
nome: "Pizza Margherita"
descricao: "Pizza tradicional italiana"
preco: 35.00
ambienteId: "uuid-da-cozinha"
disponivel: true
```

### Buscar Comandas (Caixa)
```bash
GET http://localhost:3000/comandas/search?term=João
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 🛠️ Manutenção

### Adicionar Novo Endpoint

Ao criar novos endpoints, adicione:

```typescript
@ApiTags('Seu Módulo')
@Controller('rota')
export class SeuController {
  
  @Post()
  @ApiBearerAuth() // Se protegido
  @ApiOperation({ summary: 'Descrição do endpoint' })
  @ApiResponse({ status: 201, description: 'Sucesso' })
  @ApiResponse({ status: 400, description: 'Erro de validação' })
  create(@Body() dto: CreateDto) {
    // ...
  }
}
```

### Atualizar Documentação

O Swagger é gerado automaticamente baseado nos decoradores. Ao adicionar/modificar:

1. Adicione decoradores apropriados
2. Reinicie o backend
3. Atualize a página do Swagger
4. Verifique se aparece corretamente

---

## 📞 Suporte

Se tiver dúvidas sobre a documentação:

1. Acesse `http://localhost:3000/api` e explore
2. Veja exemplos nos controllers existentes
3. Consulte [Documentação oficial do Swagger](https://docs.nestjs.com/openapi/introduction)

---

## ✨ Conclusão

**Swagger 100% implementado e funcional!** 🎉

- ✅ Todos os controllers documentados
- ✅ Bearer Authentication configurado
- ✅ Rotas públicas e protegidas identificadas
- ✅ Upload de arquivos documentado
- ✅ Exemplos e validações visíveis
- ✅ Interface interativa para testes

**Acesse agora:** http://localhost:3000/api
