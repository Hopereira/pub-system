# Pub System - Sistema de Gestão para Bares e Pubs

## 📜 Descrição do Projeto

**Pub System** é a API RESTful de backend para um sistema de gerenciamento modular e completo para bares, pubs e restaurantes. O projeto foi desenvolvido com foco em escalabilidade, segurança e boas práticas de desenvolvimento, utilizando o framework NestJS.

O sistema cobre desde a configuração fundamental do estabelecimento até a gestão operacional de comandas e pedidos, finalizando com uma API para a experiência interativa do cliente via QR Code.

**Status do Projeto:** `Backend 100% Concluído`

---

## ✨ Funcionalidades

O backend está estruturado em 4 fases modulares:

### Fase 1: Fundação e Configuração
- ✅ **Gestão de Empresa:** CRUD para os dados do estabelecimento.
- ✅ **Gestão de Ambientes:** CRUD para os locais de preparo (Cozinha, Bar, etc.).
- ✅ **Gestão de Funcionários:** CRUD para funcionários com diferentes níveis de acesso (Admin, Caixa, Garçom, Cozinha).
- ✅ **Autenticação:** Sistema de login via JWT (JSON Web Token) com sistema de permissões baseado em cargos (`Roles`).

### Fase 2: Produtos e Cardápio
- ✅ **Gestão de Produtos:** CRUD completo para os itens do cardápio.
- ✅ **Relacionamento:** Cada produto é associado a um ambiente de preparo.

### Fase 3: Operacional
- ✅ **Gestão de Mesas:** CRUD para as mesas do local, com controle de status (`LIVRE`, `OCUPADA`, etc.).
- ✅ **Gestão de Clientes:** CRUD para clientes, permitindo a abertura de comandas por CPF.
- ✅ **Gestão de Comandas:** Sistema flexível para criar comandas associadas a uma `Mesa` ou a um `Cliente`.
- ✅ **Lançamento de Pedidos:** Endpoint para criar `Pedidos` complexos, contendo múltiplos `Itens` associados a uma `Comanda`.
- ✅ **Lógica de Negócio:** Validações para garantir a integridade dos pedidos, comandas e estoque.

### Fase 4: Interação com o Cliente
- ✅ **Endpoint Público para Comandas:** Rota `GET /comandas/:id/public` que permite ao cliente, via QR Code, visualizar o status dos seus pedidos, a lista de itens consumidos e o valor total da conta em tempo real, sem necessidade de login.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:**
  - **Node.js:** Ambiente de execução JavaScript.
  - **NestJS:** Framework Node.js progressivo para construir aplicações eficientes e escaláveis.
  - **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
- **Banco de Dados:**
  - **PostgreSQL:** Banco de dados relacional open-source.
  - **TypeORM:** ORM (Object-Relational Mapper) para TypeScript.
- **Autenticação:**
  - **JWT (JSON Web Token):** Para proteger as rotas da API.
  - **Passport.js:** Middleware de autenticação.
  - **bcrypt:** Para hashing de senhas.
- **Validação:**
  - **Class-validator & Class-transformer:** Para validação e transformação de dados em DTOs.
- **Containerização:**
  - **Docker & Docker Compose:** Para criar um ambiente de desenvolvimento consistente.

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento.

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (v16 ou superior)
- [Docker](https://www.docker.com/products/docker-desktop/) (opcional, mas recomendado)
- Um cliente de API como [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/)

### Instalação

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/SeuUsuario/pub-system.git](https://github.com/SeuUsuario/pub-system.git)
   cd pub-system/backend
# Pub System - Sistema de Gestão para Bares e Pubs

## 📜 Descrição do Projeto

**Pub System** é a API RESTful de backend para um sistema de gerenciamento modular e completo para bares, pubs e restaurantes. O projeto foi desenvolvido com foco em escalabilidade, segurança e boas práticas de desenvolvimento, utilizando o framework NestJS.

O sistema cobre desde a configuração fundamental do estabelecimento até a gestão operacional de comandas e pedidos, finalizando com uma API para a experiência interativa do cliente via QR Code.

**Status do Projeto:** `Backend 100% Concluído`

---

## ✨ Funcionalidades

O backend está estruturado em 4 fases modulares:

### Fase 1: Fundação e Configuração
- ✅ **Gestão de Empresa:** CRUD para os dados do estabelecimento.
- ✅ **Gestão de Ambientes:** CRUD para os locais de preparo (Cozinha, Bar, etc.).
- ✅ **Gestão de Funcionários:** CRUD para funcionários com diferentes níveis de acesso (Admin, Caixa, Garçom, Cozinha).
- ✅ **Autenticação:** Sistema de login via JWT (JSON Web Token) com sistema de permissões baseado em cargos (`Roles`).

### Fase 2: Produtos e Cardápio
- ✅ **Gestão de Produtos:** CRUD completo para os itens do cardápio.
- ✅ **Relacionamento:** Cada produto é associado a um ambiente de preparo.

### Fase 3: Operacional
- ✅ **Gestão de Mesas:** CRUD para as mesas do local, com controle de status (`LIVRE`, `OCUPADA`, etc.).
- ✅ **Gestão de Clientes:** CRUD para clientes, permitindo a abertura de comandas por CPF.
- ✅ **Gestão de Comandas:** Sistema flexível para criar comandas associadas a uma `Mesa` ou a um `Cliente`.
- ✅ **Lançamento de Pedidos:** Endpoint para criar `Pedidos` complexos, contendo múltiplos `Itens` associados a uma `Comanda`.
- ✅ **Lógica de Negócio:** Validações para garantir a integridade dos pedidos, comandas e estoque.

### Fase 4: Interação com o Cliente
- ✅ **Endpoint Público para Comandas:** Rota `GET /comandas/:id/public` que permite ao cliente, via QR Code, visualizar o status dos seus pedidos, a lista de itens consumidos e o valor total da conta em tempo real, sem necessidade de login.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:**
  - **Node.js:** Ambiente de execução JavaScript.
  - **NestJS:** Framework Node.js progressivo para construir aplicações eficientes e escaláveis.
  - **TypeScript:** Superset do JavaScript que adiciona tipagem estática.
- **Banco de Dados:**
  - **PostgreSQL:** Banco de dados relacional open-source.
  - **TypeORM:** ORM (Object-Relational Mapper) para TypeScript.
- **Autenticação:**
  - **JWT (JSON Web Token):** Para proteger as rotas da API.
  - **Passport.js:** Middleware de autenticação.
  - **bcrypt:** Para hashing de senhas.
- **Validação:**
  - **Class-validator & Class-transformer:** Para validação e transformação de dados em DTOs.
- **Containerização:**
  - **Docker & Docker Compose:** Para criar um ambiente de desenvolvimento consistente.

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento.

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (v16 ou superior)
- [Docker](https://www.docker.com/products/docker-desktop/) (opcional, mas recomendado)
- Um cliente de API como [Postman](https://www.postman.com/) ou [Insomnia](https://insomnia.rest/)

### Instalação

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone [https://github.com/SeuUsuario/pub-system.git](https://github.com/SeuUsuario/pub-system.git)
    cd pub-system/backend
    ```

2.  **Crie o arquivo de variáveis de ambiente:**
    - Renomeie o arquivo `.env.example` (se houver) para `.env`.
    - Preencha as variáveis com os dados do seu banco de dados PostgreSQL:
      ```env
      # Configurações do Banco de Dados
      DB_HOST=localhost
      DB_PORT=5432
      DB_USER=seu_usuario_postgres
      DB_PASSWORD=sua_senha_postgres
      DB_DATABASE=pub_system_db

      # Chave secreta para o JWT
      JWT_SECRET=sua_chave_secreta_super_forte

      # Porta da aplicação
      PORT=3000
      ```

3.  **Instale as dependências:**
    ```bash
    npm install
    ```

4.  **Inicie o servidor de desenvolvimento:**
    - O servidor irá iniciar e se conectar ao banco de dados. Ele ficará observando por alterações nos arquivos (`watch mode`).
    ```bash
    npm run start:dev
    ```

A API estará disponível em `http://localhost:3000`.

---

## 🏗️ Estrutura do Projeto

O projeto segue uma arquitetura modular, onde cada funcionalidade principal reside em seu próprio diretório dentro de `src/modulos`. Isso promove a separação de responsabilidades e facilita a manutenção.

- `src/auth`: Contém toda a lógica de autenticação (JWT, guards, strategies).
- `src/modulos`: Contém os módulos de cada funcionalidade (CRUDs).
  - `/ambiente`
  - `/cliente`
  - `/comanda`
  - `/empresa`
  - `/funcionario`
  - `/mesa`
  - `/pedido`
  - `/produto`






    
