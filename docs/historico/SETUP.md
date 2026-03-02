# 🚀 Guia de Configuração do Pub System

Este guia vai te ajudar a configurar corretamente o ambiente de desenvolvimento do Pub System.

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- ✅ [Node.js](https://nodejs.org/) v16 ou superior
- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop/) (recomendado)
- ✅ [Git](https://git-scm.com/)
- ✅ Conta no [Google Cloud Platform](https://cloud.google.com/) (para upload de imagens)

---

## 🔧 Passo 1: Variáveis de Ambiente

### 1.1 - Arquivo `.env` Principal

O arquivo `.env` na raiz do projeto já existe e contém as configurações básicas. Você pode ajustá-lo se necessário:

```bash
# Na raiz do projeto (pub-system/)
# O arquivo .env já existe, mas você pode usar o .env.example como referência
```

**Valores importantes para ajustar em PRODUÇÃO:**

```env
# Troque por um segredo forte! Use: openssl rand -base64 32
JWT_SECRET=sua-chave-super-secreta-e-longa-aqui

# Ajuste as senhas do banco
DB_PASSWORD=senha_forte_aqui
POSTGRES_PASSWORD=senha_forte_aqui

# Credenciais do admin inicial
ADMIN_EMAIL=seu-email@empresa.com
ADMIN_SENHA=senha_forte_admin
```

### 1.2 - Verificar Variáveis

Execute para verificar se as variáveis estão carregadas:

```powershell
# No PowerShell
cat .env
```

---

## ☁️ Passo 2: Google Cloud Storage (GCS)

O sistema usa o Google Cloud Storage para armazenar imagens de produtos, eventos, etc.

### 2.1 - Criar Projeto no GCP

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **ID do Projeto**

### 2.2 - Criar Bucket

1. No console GCP, vá em **Cloud Storage** > **Buckets**
2. Clique em **Criar bucket**
3. Configure:
   - **Nome:** `pub-system-media-storage` (ou outro nome único)
   - **Localização:** Escolha a região mais próxima
   - **Controle de acesso:** "Uniforme"
4. Clique em **Criar**

### 2.3 - Configurar Permissões Públicas (Opcional)

Se quiser que as imagens sejam acessíveis publicamente:

1. No bucket criado, vá em **Permissões**
2. Clique em **Conceder acesso**
3. Adicione:
   - **Principais:** `allUsers`
   - **Função:** `Storage Object Viewer`
4. Salve

### 2.4 - Criar Conta de Serviço

1. No console GCP, vá em **IAM & Admin** > **Contas de serviço**
2. Clique em **Criar conta de serviço**
3. Configure:
   - **Nome:** `pub-system-storage`
   - **Descrição:** "Conta para upload de imagens do Pub System"
4. Clique em **Criar e continuar**
5. Conceda a função: **Storage Admin** ou **Storage Object Admin**
6. Clique em **Concluir**

### 2.5 - Gerar Chave JSON

1. Na lista de contas de serviço, clique na conta criada
2. Vá em **Chaves** > **Adicionar chave** > **Criar nova chave**
3. Escolha **JSON** e clique em **Criar**
4. O arquivo JSON será baixado automaticamente

### 2.6 - Configurar Credenciais no Projeto

**Opção A - Docker (Recomendado):**

```powershell
# Copie o arquivo JSON baixado para backend/gcs-credentials.json
Copy-Item "C:\Downloads\seu-projeto-123456-abc123.json" -Destination ".\backend\gcs-credentials.json"
```

**Opção B - Desenvolvimento Local:**

```powershell
# Defina a variável de ambiente apontando para o arquivo
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\caminho\completo\para\gcs-credentials.json"
```

### 2.7 - Atualizar .env

Edite o arquivo `.env` na raiz do projeto:

```env
# Nome do bucket que você criou
GCS_BUCKET_NAME=pub-system-media-storage

# Caminho para as credenciais
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json
```

### 2.8 - Testar Credenciais

```powershell
# Verifique se o arquivo existe
Test-Path .\backend\gcs-credentials.json

# Deve retornar: True
```

---

## 🗄️ Passo 3: Migrations do Banco de Dados

As migrations criam a estrutura inicial do banco (tabelas, índices, etc.).

### 3.1 - Com Docker (Recomendado)

```powershell
# 1. Inicie os containers
docker-compose up -d

# 2. Aguarde o banco ficar pronto (cerca de 10 segundos)
Start-Sleep -Seconds 10

# 3. Execute as migrations
docker-compose exec backend npm run typeorm:migration:run

# Você deve ver mensagens como:
# "Migration InitialSchema1759508612345 has been executed successfully"
```

### 3.2 - Desenvolvimento Local (Sem Docker)

```powershell
# 1. Certifique-se que o PostgreSQL está rodando localmente
# Ajuste o .env para usar localhost:
# DB_HOST=localhost

# 2. Entre na pasta do backend
cd backend

# 3. Instale as dependências
npm install

# 4. Execute as migrations
npm run typeorm:migration:run
```

### 3.3 - Verificar Migrations Aplicadas

```powershell
# Liste as migrations executadas
docker-compose exec backend npm run typeorm -- migration:show

# Ou conecte-se ao banco via pgAdmin:
# http://localhost:8080
# Email: admin@admin.com
# Senha: admin
```

### 3.4 - Criar Nova Migration (Quando Necessário)

```powershell
# Gere uma nova migration baseada nas mudanças das entidades
docker-compose exec backend npm run typeorm:migration:generate -- src/database/migrations/NomeDaMudanca

# Exemplo:
docker-compose exec backend npm run typeorm:migration:generate -- src/database/migrations/AddEmailToCliente
```

---

## 🌱 Passo 4: Seed do Banco (Dados Iniciais)

O sistema possui um seeder para criar dados iniciais (admin, ambientes, produtos de exemplo).

### 4.1 - Executar Seed

```powershell
# Com Docker
docker-compose exec backend npm run seed

# Ou adicione ao package.json e execute:
# "seed": "ts-node src/database/seeder.service.ts"
```

### 4.2 - Dados Criados

Após executar o seed, você terá:

- ✅ Usuário admin (email e senha do .env)
- ✅ Ambientes padrão (Cozinha, Bar)
- ✅ Produtos de exemplo (opcional)

---

## ✅ Passo 5: Verificação Final

### 5.1 - Checklist de Configuração

```powershell
# Execute este script para verificar tudo:

# 1. Variáveis de ambiente
Write-Host "Verificando .env..." -ForegroundColor Cyan
Test-Path .env

# 2. Credenciais GCS
Write-Host "Verificando GCS credentials..." -ForegroundColor Cyan
Test-Path .\backend\gcs-credentials.json

# 3. Containers rodando
Write-Host "Verificando containers..." -ForegroundColor Cyan
docker-compose ps

# 4. Backend respondendo
Write-Host "Verificando backend..." -ForegroundColor Cyan
curl http://localhost:3000

# 5. Frontend respondendo
Write-Host "Verificando frontend..." -ForegroundColor Cyan
curl http://localhost:3001
```

### 5.2 - Acessar os Serviços

Após tudo configurado:

- 🔗 **Backend API:** http://localhost:3000
- 🔗 **Frontend:** http://localhost:3001
- 🔗 **PgAdmin:** http://localhost:8080
- 📚 **Swagger (se configurado):** http://localhost:3000/api

### 5.3 - Fazer Login

Use as credenciais do admin configuradas no `.env`:

- **Email:** `admin@admin.com` (ou o que você configurou)
- **Senha:** `admin123` (ou o que você configurou)

---

## 🐛 Solução de Problemas

### Erro: "Cannot find module 'dotenv'"

```powershell
cd backend
npm install dotenv
```

### Erro: "Google Cloud Storage authentication failed"

```powershell
# Verifique se o arquivo JSON existe
Test-Path .\backend\gcs-credentials.json

# Verifique se o caminho no .env está correto
cat .env | Select-String "GOOGLE_APPLICATION_CREDENTIALS"

# Recrie as credenciais no GCP se necessário
```

### Erro: "Migration ... has already been executed"

```powershell
# Normal! Significa que a migration já foi aplicada
# Para reverter (cuidado, pode perder dados):
docker-compose exec backend npm run typeorm -- migration:revert
```

### Container do banco não inicia

```powershell
# Remova volumes antigos
docker-compose down -v

# Recrie tudo
docker-compose up -d --build
```

### Porta 3000 ou 5432 já em uso

```powershell
# Ajuste as portas no docker-compose.yml:
# Para backend: "3002:3000"
# Para banco: "5433:5432"
```

---

## 📚 Próximos Passos

Após a configuração:

1. ✅ Explore a [documentação da API](./README.md)
2. ✅ Configure o Swagger para testar endpoints
3. ✅ Personalize o sistema para suas necessidades
4. ✅ Configure CI/CD para deploy em produção

---

## 🔒 Segurança em Produção

**IMPORTANTE:** Antes de fazer deploy em produção:

1. ❌ **NUNCA** commite o arquivo `.env` ou `gcs-credentials.json`
2. ✅ Use variáveis de ambiente do servidor/cloud provider
3. ✅ Gere um JWT_SECRET forte: `openssl rand -base64 32`
4. ✅ Use senhas fortes para banco e admin
5. ✅ Configure HTTPS/SSL
6. ✅ Ative firewall e restrinja acessos ao banco
7. ✅ Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)

---

## 💡 Dicas

- Use o **PgAdmin** (http://localhost:8080) para visualizar o banco de dados
- Monitore os logs com: `docker-compose logs -f backend`
- Reinicie apenas o backend: `docker-compose restart backend`
- Limpe tudo e recomece: `docker-compose down -v && docker-compose up -d --build`

---

## 📞 Suporte

Se encontrar problemas, verifique:

1. Logs do container: `docker-compose logs backend`
2. Status dos containers: `docker-compose ps`
3. Conexão com banco: acesse PgAdmin e tente conectar manualmente

---

**✨ Pronto! Seu ambiente está configurado e pronto para uso!**
