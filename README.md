# 🍺 Pub System - Sistema de Gestão para Bares e Pubs

<div align="center">

![Status](https://img.shields.io/badge/Status-Ativo-success)
![Backend](https://img.shields.io/badge/Backend-NestJS%2010-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015-blue)
![Database](https://img.shields.io/badge/Database-PostgreSQL%2015-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Sistema completo de gerenciamento para bares, pubs e restaurantes**

[🚀 Início Rápido](#-início-rápido) • [📖 Documentação](#-documentação) • [🛠️ Tecnologias](#️-tecnologias) • [🤝 Contribuição](#-contribuição)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#️-tecnologias)
- [Início Rápido](#-início-rápido)
- [Estrutura do Projeto](#️-estrutura-do-projeto)
- [API Endpoints](#-api-endpoints)
- [Configuração](#-configuração)
- [Documentação](#-documentação)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **Pub System** é uma solução completa de gerenciamento para estabelecimentos como bares, pubs e restaurantes. Desenvolvido com arquitetura moderna e modular, o sistema oferece desde a gestão básica do estabelecimento até funcionalidades avançadas como notificações em tempo real e interação com clientes via QR Code.

### 🌟 Principais Diferenciais

- **🔄 Sistema Dinâmico:** Ambientes de preparo totalmente configuráveis
- **⚡ Tempo Real:** WebSocket para atualizações instantâneas
- **📱 QR Code:** Interface pública para clientes acompanharem pedidos
- **🔔 Notificações:** Sistema sonoro inteligente por ambiente
- **🐳 Containerizado:** Ambiente de desenvolvimento com Docker
- **📚 Documentado:** Guias completos de setup e uso

---

## ✨ Funcionalidades

### 🏢 Gestão Empresarial
- ✅ **Empresa:** Cadastro e gestão dos dados do estabelecimento
- ✅ **Ambientes:** Criação dinâmica de locais de preparo (Cozinha, Bar, etc.)
- ✅ **Funcionários:** Sistema de usuários com diferentes níveis de acesso
- ✅ **Autenticação:** JWT com sistema de permissões baseado em roles

### 🍽️ Cardápio e Produtos
- ✅ **Produtos:** CRUD completo com upload de imagens (Google Cloud Storage)
- ✅ **Categorização:** Associação de produtos aos ambientes de preparo
- ✅ **Validações:** Controle de integridade e regras de negócio

### 🎯 Operacional
- ✅ **Mesas:** Gestão com controle de status (LIVRE, OCUPADA, RESERVADA)
- ✅ **Clientes:** Cadastro e gestão de clientes
- ✅ **Comandas:** Sistema flexível (Mesa ou Cliente)
- ✅ **Pedidos:** Lançamento de pedidos complexos com múltiplos itens
- ✅ **Notificações:** Sistema sonoro por ambiente em tempo real

### 👥 Experiência do Cliente
- ✅ **QR Code:** Visualização pública de comandas sem login
- ✅ **Tempo Real:** Acompanhamento do status dos pedidos
- ✅ **Eventos:** Sistema de eventos especiais com landing pages

### 🚀 Funcionalidades Avançadas
- ✅ **WebSocket:** Comunicação em tempo real
- ✅ **Upload de Imagens:** Integração com Google Cloud Storage
- ✅ **Migrations:** Sistema de versionamento do banco de dados
- ✅ **Seeder:** Dados iniciais para desenvolvimento
- ✅ **Landing Pages:** Páginas personalizadas para eventos
- ✅ **App Router:** Next.js 13+ com roteamento baseado em arquivos
- ✅ **Turbopack:** Build otimizado para desenvolvimento
- ✅ **TypeScript:** Tipagem completa em frontend e backend
- ✅ **Responsive Design:** Interface adaptável para todos os dispositivos

---

## 🛠️ Tecnologias

### Backend
- **[NestJS 10](https://nestjs.com/)** - Framework Node.js progressivo
- **[TypeScript 5.1.3](https://www.typescriptlang.org/)** - Superset JavaScript com tipagem
- **[PostgreSQL 15](https://www.postgresql.org/)** - Banco de dados relacional
- **[TypeORM 0.3.17](https://typeorm.io/)** - ORM para TypeScript
- **[JWT](https://jwt.io/)** + **[Passport.js](http://www.passportjs.org/)** - Autenticação
- **[Socket.IO 4.7.4](https://socket.io/)** - WebSocket para tempo real
- **[Google Cloud Storage 7.17.1](https://cloud.google.com/storage)** - Upload de arquivos
- **[bcrypt](https://www.npmjs.com/package/bcrypt)** - Hash de senhas
- **[class-validator](https://github.com/typestack/class-validator)** + **[class-transformer](https://github.com/typestack/class-transformer)** - Validação e transformação
- **[Swagger](https://swagger.io/)** - Documentação automática da API

### Frontend
- **[Next.js 15.5.2](https://nextjs.org/)** - Framework React com Turbopack
- **[React 19.1.0](https://react.dev/)** - Biblioteca de interface
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS
- **[Radix UI](https://www.radix-ui.com/)** + **[shadcn/ui](https://ui.shadcn.com/)** - Componentes
- **[React Hook Form](https://react-hook-form.com/)** + **[Zod 4.1.5](https://zod.dev/)** - Formulários e validação
- **[Lucide React](https://lucide.dev/)** - Ícones
- **[Sonner](https://sonner.emilkowal.ski/)** - Notificações toast
- **[QR Code React](https://www.npmjs.com/package/qrcode.react)** - Geração de QR Codes

### DevOps
- **[Docker](https://www.docker.com/)** + **[Docker Compose](https://docs.docker.com/compose/)** - Containerização
- **[PgAdmin](https://www.pgadmin.org/)** - Interface gráfica do PostgreSQL

---

## 🚀 Início Rápido

### Setup Automatizado (Recomendado)

```powershell
# Clone o repositório
git clone https://github.com/seu-usuario/pub-system.git
cd pub-system

# Execute o script de setup automatizado
.\setup.ps1

# OU verifique a configuração atual
.\verify-setup.ps1
```

### 🐳 Scripts Docker Disponíveis

```powershell
# Iniciar containers (uso diário)
.\docker-start.ps1

# Reconstruir containers do zero (quando houver problemas)
.\docker-rebuild.ps1

# Parar containers
docker-compose down

# Ver logs em tempo real
docker-compose logs -f
```

> **💡 Dica:** Use `docker-start.ps1` no dia a dia. Use `docker-rebuild.ps1` apenas quando:
> - Instalar novas dependências nativas (bcrypt, sharp, etc.)
> - Mudar versões do Node.js
> - Ter problemas com módulos compilados

### Pré-requisitos

- **[Node.js](https://nodejs.org/) v16 ou superior**
- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**
- **[Git](https://git-scm.com/)**
- **Conta no [Google Cloud Platform](https://cloud.google.com/) (para upload de imagens)**

### Configuração Manual

<details>
<summary>Clique para ver os passos detalhados</summary>

1. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

2. **Inicie os containers:**
   ```bash
   docker-compose up -d
   ```

3. **Execute as migrations:**
   ```bash
   docker-compose exec backend npm run typeorm:migration:run
   ```

4. **Execute o seeder (opcional):**
   ```bash
   docker-compose exec backend npm run seed
   ```

</details>

### Acessos

Após a configuração, os serviços estarão disponíveis em:

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **PgAdmin:** http://localhost:8080
- **Login:** `admin@admin.com` / `admin123`

---

## 🏗️ Estrutura do Projeto

```
pub-system/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── auth/           # Autenticação e autorização
│   │   ├── database/       # Migrations e configurações do BD
│   │   ├── modulos/        # Módulos de funcionalidades
│   │   │   ├── ambiente/   # Gestão de ambientes
│   │   │   ├── cliente/    # Gestão de clientes
│   │   │   ├── comanda/    # Sistema de comandas
│   │   │   ├── empresa/    # Dados do estabelecimento
│   │   │   ├── evento/     # Eventos especiais
│   │   │   ├── funcionario/# Gestão de funcionários
│   │   │   ├── mesa/       # Gestão de mesas
│   │   │   ├── pagina-evento/ # Landing pages de eventos
│   │   │   ├── pedido/     # Sistema de pedidos
│   │   │   └── produto/    # Gestão de produtos
│   │   ├── shared/         # Módulos compartilhados
│   │   └── types/          # Definições de tipos
│   ├── test/               # Testes automatizados
│   ├── gcs-credentials.json # Credenciais Google Cloud
│   └── package.json
├── frontend/               # Interface Next.js
│   ├── src/
│   │   ├── app/           # App Router (Next.js 13+)
│   │   │   ├── (auth)/    # Rotas de autenticação
│   │   │   ├── (cliente)/ # Interface pública
│   │   │   ├── (protected)/ # Rotas protegidas
│   │   │   ├── comanda/   # Visualização de comandas
│   │   │   ├── entrada/   # Página inicial
│   │   │   └── evento/    # Landing pages de eventos
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── context/       # Contextos React
│   │   ├── hooks/         # Hooks customizados
│   │   ├── layouts/       # Layouts da aplicação
│   │   ├── lib/           # Utilitários e configurações
│   │   ├── services/      # Serviços de API
│   │   └── types/         # Definições de tipos TypeScript
│   ├── public/            # Arquivos estáticos
│   └── package.json
├── docker-compose.yml      # Configuração dos containers
├── .env.example           # Template de variáveis de ambiente
├── setup.ps1              # Script de configuração automática
├── verify-setup.ps1       # Script de verificação
└── Documentação adicional:
    ├── CONFIGURATION.md    # Resumo das configurações
    ├── CREATE_TEST_DATA.md # Criação de dados de teste
    ├── DADOS_TESTE.md      # Dados para testes
    ├── IMPLEMENTACAO_NOTIFICACOES.md # Implementação de notificações
    ├── MIGRATIONS.md       # Guia de migrations
    ├── NOTIFICACOES.md     # Sistema de notificações
    ├── README_NOTIFICACOES.md # Documentação de notificações
    ├── RELATORIO_SESSAO.md # Relatório de desenvolvimento
    └── SETUP.md            # Guia completo de configuração
```

---

## 🔌 API Endpoints

### 🔐 Autenticação
```http
POST /auth/login              # Login de funcionários
GET  /auth/profile           # Perfil do usuário logado
```

### 🏢 Gestão
```http
GET    /empresas             # Listar empresas
POST   /empresas             # Criar empresa
PUT    /empresas/:id         # Atualizar empresa
DELETE /empresas/:id         # Deletar empresa
```

### 🍽️ Operacional
```http
GET    /mesas                # Listar mesas
POST   /comandas             # Criar comanda
GET    /comandas/:id         # Detalhes da comanda
POST   /pedidos              # Criar pedido
PUT    /pedidos/:id/status   # Atualizar status do pedido
```

### 📱 Interface Pública
```http
GET    /comandas/:id/public  # Visualização pública (QR Code)
GET    /evento/:slug         # Landing page de eventos
```

### 📁 Upload e Mídia
```http
POST   /upload               # Upload de imagens (GCS)
GET    /pagina-evento        # Gerenciamento de landing pages
POST   /pagina-evento        # Criar landing page
```
> 📖 **Documentação completa da API:** Disponível via Swagger em `http://localhost:3000/api` (quando configurado)

---

## ⚙️ Configuração

### 🔑 Variáveis de Ambiente Principais

```env
# Banco de Dados
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_forte
DB_DATABASE=pub_system_db

# Segurança
JWT_SECRET=sua_chave_jwt_super_secreta

# Google Cloud Storage
GCS_BUCKET_NAME=seu-bucket-gcs
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json

# Administrador Inicial
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123
```

### 🔒 Segurança em Produção

- ⚠️ **Gere um JWT_SECRET forte:** `openssl rand -base64 32`
- ⚠️ **Use senhas fortes** para banco e admin
- ⚠️ **Configure HTTPS/SSL**
- ⚠️ **Use secrets management** (AWS Secrets, Azure Key Vault, etc.)
- ⚠️ **Configure firewall** e restrinja acessos
- ⚠️ **Proteja credenciais GCS** - nunca commite `gcs-credentials.json`
- ⚠️ **Configure CORS** adequadamente para produção
- ⚠️ **Use rate limiting** para prevenir ataques DDoS

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| 📘 **[SETUP.md](./SETUP.md)** | Guia completo de configuração do ambiente |
| 📗 **[MIGRATIONS.md](./MIGRATIONS.md)** | Guia de migrations do banco de dados |
| 🔔 **[NOTIFICACOES.md](./NOTIFICACOES.md)** | Sistema de notificações em tempo real |
| 🔔 **[README_NOTIFICACOES.md](./README_NOTIFICACOES.md)** | Documentação detalhada de notificações |
| 🔧 **[IMPLEMENTACAO_NOTIFICACOES.md](./IMPLEMENTACAO_NOTIFICACOES.md)** | Implementação técnica de notificações |
| ⚙️ **[CONFIGURATION.md](./CONFIGURATION.md)** | Resumo das configurações aplicadas |
| 🧪 **[CREATE_TEST_DATA.md](./CREATE_TEST_DATA.md)** | Criação de dados para testes |
| 📊 **[DADOS_TESTE.md](./DADOS_TESTE.md)** | Dados de exemplo e testes |
| 📈 **[RELATORIO_SESSAO.md](./RELATORIO_SESSAO.md)** | Relatório de desenvolvimento |

---

## 🧪 Testes

### Backend
```bash
# Desenvolvimento
npm run start:dev          # Inicia em modo desenvolvimento
npm run start:debug        # Inicia em modo debug
npm run build              # Build para produção
npm run start:prod         # Inicia versão de produção

# Banco de Dados
npm run typeorm:migration:generate -- src/database/migrations/NomeDaMigration
npm run typeorm:migration:run       # Executa migrations

# Testes
npm run test               # Testes unitários
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com coverage
npm run test:e2e           # Testes end-to-end

# Qualidade de Código
npm run lint               # ESLint
npm run format             # Prettier
```

### Frontend
```bash
# Desenvolvimento
npm run dev                # Inicia servidor de desenvolvimento
npm run build              # Build com Turbopack
npm run start              # Inicia versão de produção
npm run lint               # ESLint
```

### Docker
```bash
# Gerenciamento de containers
docker-compose up -d       # Inicia todos os serviços
docker-compose down        # Para todos os serviços
docker-compose logs -f     # Visualiza logs em tempo real
docker-compose exec backend npm run typeorm:migration:run
```

---

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Para contribuir:

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

### 📋 Diretrizes

- Siga os padrões de código existentes
- Adicione testes para novas funcionalidades
- Atualize a documentação quando necessário
- Use commits semânticos (feat, fix, docs, etc.)

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte (24) 99828-5751

Se encontrar problemas ou tiver dúvidas:

1. 🔍 Verifique a [documentação](./SETUP.md)
2. 🐛 Abra uma [issue](https://github.com/seu-usuario/pub-system/issues)
3. 💬 Entre em contato via [email](mailto:pereira_hebert@msn.com)

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

Desenvolvido com ❤️ para a comunidade

</div>

    
