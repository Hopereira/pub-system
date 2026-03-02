# 🧪 Guia de Testes Manuais - Dashboard ADM

**URL:** https://pub-system.vercel.app ou http://localhost:3001  
**Login:** `admin@admin.com` / `admin123`

---

## 📋 Checklist de Testes

### 1. 🔐 Autenticação
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (deve mostrar erro)
- [ ] Logout
- [ ] Redirecionamento para login quando não autenticado

---

### 2. 🏠 Dashboard Principal (`/dashboard`)
- [ ] Carrega corretamente após login
- [ ] Cards de métricas exibem dados
- [ ] Links de navegação funcionam
- [ ] Menu lateral (sidebar) funciona

---

### 3. 👥 Funcionários (`/dashboard/admin/funcionarios`)
- [ ] Listar funcionários
- [ ] Criar novo funcionário
- [ ] Editar funcionário existente
- [ ] Excluir funcionário
- [ ] Validação de campos obrigatórios
- [ ] Atribuição de roles (ADMIN, GERENTE, CAIXA, GARCOM, COZINHEIRO)

---

### 4. 🏢 Ambientes (`/dashboard/admin/ambientes`)
- [ ] Listar ambientes
- [ ] Criar ambiente de PREPARO (Cozinha, Bar, etc.)
- [ ] Criar ambiente de ATENDIMENTO (Salão, Varanda, etc.)
- [ ] Editar ambiente
- [ ] Excluir ambiente (verificar se bloqueia quando tem produtos/mesas)
- [ ] Ativar/Desativar ambiente

---

### 5. 🪑 Mesas (`/dashboard/admin/mesas` ou `/dashboard/operacional/mesas`)
- [ ] Listar mesas por ambiente
- [ ] Criar nova mesa
- [ ] Editar mesa (número, capacidade)
- [ ] Excluir mesa
- [ ] Verificar status (LIVRE, OCUPADA, RESERVADA)
- [ ] Mapa de mesas (se existir)

---

### 6. 📍 Pontos de Entrega (`/dashboard/admin/pontos-entrega`)
- [ ] Listar pontos de entrega
- [ ] Criar ponto de entrega
- [ ] Editar ponto de entrega
- [ ] Excluir ponto de entrega
- [ ] Ativar/Desativar

---

### 7. 🍔 Produtos/Cardápio (`/dashboard/cardapio`)
- [ ] Listar produtos
- [ ] Criar produto com imagem
- [ ] Criar produto sem imagem
- [ ] Editar produto
- [ ] Atualizar imagem do produto
- [ ] Excluir produto
- [ ] Filtrar por categoria
- [ ] Vincular produto a ambiente de preparo
- [ ] Ativar/Desativar produto

---

### 8. 👤 Clientes (`/dashboard/admin/clientes`)
- [ ] Listar clientes
- [ ] Criar cliente
- [ ] Editar cliente
- [ ] Buscar cliente por CPF
- [ ] Buscar cliente por nome

---

### 9. 📝 Comandas (`/dashboard/comandas`)
- [ ] Listar comandas abertas
- [ ] Abrir nova comanda (com mesa)
- [ ] Abrir nova comanda (balcão/ponto de entrega)
- [ ] Buscar comanda por número/cliente
- [ ] Ver detalhes da comanda
- [ ] Fechar comanda (selecionar forma de pagamento)

---

### 10. 🛒 Pedidos (`/dashboard/operacional/gestao`)
- [ ] Visualizar pedidos (view ADMIN/GERENTE)
- [ ] Filtrar por ambiente
- [ ] Filtrar por status
- [ ] Ver detalhes do pedido

---

### 11. 👨‍🍳 Painel de Preparo (`/dashboard/operacional/[ambienteId]`)
- [ ] Selecionar ambiente de preparo
- [ ] Ver pedidos pendentes (Kanban)
- [ ] Atualizar status: FEITO → EM_PREPARO
- [ ] Atualizar status: EM_PREPARO → PRONTO
- [ ] Notificação sonora de novo pedido

---

### 12. 💰 Caixa (`/dashboard/operacional/caixa`)
- [ ] Abrir caixa
- [ ] Buscar comanda (aba Buscar)
- [ ] Ver mesas (aba Mesas)
- [ ] Ver clientes (aba Clientes)
- [ ] Fechar comanda com pagamento
- [ ] Registrar sangria
- [ ] Fechar caixa

---

### 13. 📅 Eventos (`/dashboard/admin/agenda-eventos`)
- [ ] Listar eventos
- [ ] Criar evento
- [ ] Editar evento
- [ ] Upload de imagem do evento
- [ ] Excluir evento
- [ ] Ativar/Desativar evento

---

### 14. 📄 Páginas de Evento (`/dashboard/admin/paginas-evento`)
- [ ] Listar páginas
- [ ] Criar página de evento
- [ ] Editar página
- [ ] Upload de mídia
- [ ] Visualizar página pública

---

### 15. 🏪 Empresa (`/dashboard/admin/empresa`)
- [ ] Ver dados da empresa
- [ ] Editar dados da empresa
- [ ] Upload de logo

---

## 🐛 Registro de Bugs Encontrados

| # | Módulo | Descrição | Status |
|---|--------|-----------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## ✅ Resultado Final

- **Total de testes:** ___
- **Passou:** ___
- **Falhou:** ___
- **Data:** ___/___/2025
- **Testador:** ___

---

## 📝 Observações

_Adicione aqui observações gerais sobre os testes_
