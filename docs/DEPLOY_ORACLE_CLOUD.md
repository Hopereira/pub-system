# 🚀 Deploy na Oracle Cloud - Guia Completo

Este documento explica **passo a passo** como fazer o deploy do Pub System em um servidor Oracle Cloud Free Tier.

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Criar Conta na Oracle Cloud](#2-criar-conta-na-oracle-cloud)
3. [Criar Instância de VM](#3-criar-instância-de-vm)
4. [Conectar via SSH](#4-conectar-via-ssh)
5. [Configurar o Servidor](#5-configurar-o-servidor)
6. [Liberar Portas (Firewall)](#6-liberar-portas-firewall)
7. [Clonar e Configurar o Projeto](#7-clonar-e-configurar-o-projeto)
8. [Subir o Sistema com Docker](#8-subir-o-sistema-com-docker)
9. [Verificar e Acessar](#9-verificar-e-acessar)
10. [Comandos Úteis](#10-comandos-úteis)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Pré-requisitos

Antes de começar, você precisa:

- ✅ Conta de email válida
- ✅ Cartão de crédito (não será cobrado no Free Tier)
- ✅ Cliente SSH (Terminal no Mac/Linux, PowerShell ou PuTTY no Windows)
- ✅ Conhecimento básico de terminal Linux

---

## 2. Criar Conta na Oracle Cloud

### 2.1. Acessar o site

1. Acesse: **https://www.oracle.com/cloud/free/**
2. Clique em **"Start for free"**

### 2.2. Preencher dados

1. **Email**: Seu email válido
2. **País**: Brasil
3. **Nome**: Seu nome completo

### 2.3. Verificar email

1. Você receberá um email de verificação
2. Clique no link para confirmar

### 2.4. Completar cadastro

1. **Senha**: Crie uma senha forte
2. **Tipo de conta**: Individual
3. **Região**: Brazil East (São Paulo) - `sa-saopaulo-1`
4. **Cartão de crédito**: Necessário para verificação (não será cobrado)

### 2.5. Aguardar aprovação

- A conta pode levar de **minutos a algumas horas** para ser aprovada
- Você receberá um email quando estiver pronta

---

## 3. Criar Instância de VM

### 3.1. Acessar o Console

1. Acesse: **https://cloud.oracle.com/**
2. Faça login com suas credenciais
3. Você verá o **Dashboard** da Oracle Cloud

### 3.2. Criar Compute Instance

1. No menu lateral, clique em **"Compute"** → **"Instances"**
2. Clique no botão **"Create instance"**

### 3.3. Configurar a instância

#### Nome e Compartment
```
Name: pub-system-server
Compartment: (root) - deixe o padrão
```

#### Placement (Localização)
```
Availability Domain: AD-1 (ou qualquer disponível)
```

#### Image and Shape (Sistema e Hardware)

1. Clique em **"Edit"** na seção Image and shape
2. **Image**: Ubuntu 22.04 (Canonical Ubuntu)
3. **Shape**: Clique em "Change shape"
   - Shape series: **Ampere** (ARM - melhor custo-benefício)
   - Shape name: **VM.Standard.A1.Flex**
   - OCPUs: **2** (máximo gratuito)
   - Memory: **12 GB** (máximo gratuito)

> ⚠️ **IMPORTANTE**: O Free Tier permite até 4 OCPUs e 24GB RAM total. Recomendo 2 OCPUs e 12GB para este projeto.

#### Networking (Rede)

1. **Virtual cloud network**: Create new VCN
2. **Subnet**: Create new public subnet
3. **Public IPv4 address**: **Assign a public IPv4 address** ✅

#### Add SSH keys (Chaves SSH)

**Opção A - Gerar nova chave (Recomendado para iniciantes):**
1. Selecione **"Generate a key pair for me"**
2. Clique em **"Save private key"** - GUARDE ESTE ARQUIVO!
3. O arquivo será salvo como `ssh-key-YYYY-MM-DD.key`

**Opção B - Usar chave existente:**
1. Selecione **"Upload public key files"**
2. Faça upload do seu arquivo `.pub`

#### Boot volume (Disco)

```
Boot volume size: 50 GB (padrão, suficiente)
```

### 3.4. Criar a instância

1. Revise as configurações
2. Clique em **"Create"**
3. Aguarde o status mudar para **"RUNNING"** (2-5 minutos)

### 3.5. Anotar o IP Público

Após a criação, na página da instância você verá:
```
Public IP address: XXX.XXX.XXX.XXX
```
**Anote este IP!** Você usará para acessar o sistema.

---

## 4. Conectar via SSH

### 4.1. Windows (PowerShell)

```powershell
# Ajustar permissões da chave (executar uma vez)
icacls "C:\caminho\para\ssh-key.key" /inheritance:r /grant:r "$($env:USERNAME):(R)"

# Conectar
ssh -i "C:\caminho\para\ssh-key.key" ubuntu@SEU_IP_PUBLICO
```

### 4.2. Mac/Linux (Terminal)

```bash
# Ajustar permissões da chave (executar uma vez)
chmod 400 ~/caminho/para/ssh-key.key

# Conectar
ssh -i ~/caminho/para/ssh-key.key ubuntu@SEU_IP_PUBLICO
```

### 4.3. Primeira conexão

Na primeira conexão, você verá:
```
The authenticity of host 'XXX.XXX.XXX.XXX' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
Digite **yes** e pressione Enter.

---

## 5. Configurar o Servidor

Após conectar via SSH, execute os comandos abaixo:

### 5.1. Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2. Instalar Docker e Git

```bash
# Instalar Docker, Docker Compose e Git
sudo apt install -y git docker.io docker-compose-v2

# Adicionar seu usuário ao grupo docker (evita usar sudo)
sudo usermod -aG docker $USER

# Aplicar permissão imediatamente
newgrp docker
```

### 5.3. Verificar instalação

```bash
docker --version
# Docker version 24.x.x

docker compose version
# Docker Compose version v2.x.x

git --version
# git version 2.x.x
```

---

## 6. Liberar Portas (Firewall)

### 6.1. Firewall da Oracle Cloud (Security List)

Este é o passo **MAIS IMPORTANTE** e frequentemente esquecido!

1. No Console Oracle Cloud, vá em **"Networking"** → **"Virtual Cloud Networks"**
2. Clique na sua VCN (ex: `vcn-YYYYMMDD-XXXX`)
3. Clique em **"Security Lists"** no menu lateral
4. Clique na security list padrão (ex: `Default Security List for vcn-...`)
5. Clique em **"Add Ingress Rules"**

#### Adicionar regras para cada porta:

**Porta 3000 (Backend API):**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 3000
Description: Backend API
```

**Porta 3001 (Frontend):**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 3001
Description: Frontend Next.js
```

**Porta 8080 (PGAdmin - opcional):**
```
Source Type: CIDR
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port Range: 8080
Description: PGAdmin
```

### 6.2. Firewall do Ubuntu (iptables)

Volte ao terminal SSH e execute:

```bash
# Liberar portas no iptables
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

# Salvar regras permanentemente
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 7. Clonar e Configurar o Projeto

### 7.1. Clonar o repositório

```bash
cd ~
git clone https://github.com/Hopereira/pub-system.git
cd pub-system
```

### 7.2. Criar arquivo .env

```bash
cp .env.example .env
nano .env
```

### 7.3. Configurar variáveis de produção

Edite o arquivo `.env` com as seguintes configurações:

```env
# ============================================
# BANCO DE DADOS (Use senhas FORTES!)
# ============================================
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=SuaSenhaForte@2024!
DB_DATABASE=pub_system_db

POSTGRES_USER=postgres
POSTGRES_PASSWORD=SuaSenhaForte@2024!
POSTGRES_DB=pub_system_db

# ============================================
# PGADMIN
# ============================================
PGADMIN_DEFAULT_EMAIL=admin@seupub.com.br
PGADMIN_DEFAULT_PASSWORD=PgAdmin@Seguro2024!

# ============================================
# JWT SECRET (GERE UM NOVO!)
# Execute: openssl rand -base64 32
# ============================================
JWT_SECRET=COLE_AQUI_O_RESULTADO_DO_OPENSSL

# ============================================
# ADMIN INICIAL (Troque após primeiro login!)
# ============================================
ADMIN_EMAIL=admin@admin.com
ADMIN_SENHA=admin123

# ============================================
# GOOGLE CLOUD STORAGE (Opcional)
# ============================================
GCS_BUCKET_NAME=pub-system-media-storage
GOOGLE_APPLICATION_CREDENTIALS=/usr/src/app/gcs-credentials.json

# ============================================
# URLs - SUBSTITUA PELO SEU IP PÚBLICO!
# ============================================
BACKEND_URL=http://SEU_IP_PUBLICO:3000
NEXT_PUBLIC_API_URL=http://SEU_IP_PUBLICO:3000
API_URL_SERVER=http://backend:3000
FRONTEND_URL=http://SEU_IP_PUBLICO:3001
```

### 7.4. Gerar JWT_SECRET seguro

```bash
# Gerar secret
openssl rand -base64 32

# Copie o resultado e cole no JWT_SECRET do .env
```

### 7.5. Salvar o arquivo

No nano:
- **Ctrl + O** → Enter (salvar)
- **Ctrl + X** (sair)

---

## 8. Subir o Sistema com Docker

### 8.1. Build e iniciar containers

```bash
cd ~/pub-system
docker compose up -d --build
```

### 8.2. Acompanhar o progresso

```bash
# Ver logs em tempo real (Ctrl+C para sair)
docker compose logs -f
```

### 8.3. Tempo estimado

| Etapa | Tempo |
|-------|-------|
| Download imagens Docker | 2-3 min |
| Build Backend (NestJS) | 5-8 min |
| Build Frontend (Next.js) | 8-12 min |
| Inicialização | 1-2 min |
| **Total** | **15-25 min** |

### 8.4. Sinais de que está pronto

**Backend:**
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [NestApplication] Nest application successfully started
```

**Frontend:**
```
✓ Ready in X.Xs
```

---

## 9. Verificar e Acessar

### 9.1. Verificar status dos containers

```bash
docker compose ps
```

Saída esperada:
```
NAME                  STATUS
pub_system_backend    Up (healthy)
pub_system_frontend   Up
pub_system_db         Up (healthy)
pub_system_pgadmin    Up
```

### 9.2. URLs de acesso

| Serviço | URL |
|---------|-----|
| **Frontend** | `http://SEU_IP:3001` |
| **Backend API** | `http://SEU_IP:3000` |
| **API Docs (Swagger)** | `http://SEU_IP:3000/api` |
| **PGAdmin** | `http://SEU_IP:8080` |

### 9.3. Login padrão

```
Email: admin@admin.com
Senha: admin123
```

> ⚠️ **IMPORTANTE**: Troque a senha do admin após o primeiro login!

---

## 10. Comandos Úteis

### Gerenciamento de containers

```bash
# Iniciar containers
docker compose up -d

# Parar containers
docker compose down

# Reiniciar containers
docker compose restart

# Ver status
docker compose ps

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend
```

### Manutenção

```bash
# Atualizar código do GitHub
cd ~/pub-system
git pull
docker compose down
docker compose up -d --build

# Limpar imagens não utilizadas
docker system prune -a

# Ver uso de disco
docker system df
```

### Banco de dados

```bash
# Acessar container do banco
docker exec -it pub_system_db psql -U postgres -d pub_system_db

# Backup do banco
docker exec pub_system_db pg_dump -U postgres pub_system_db > backup.sql

# Restaurar backup
cat backup.sql | docker exec -i pub_system_db psql -U postgres -d pub_system_db
```

---

## 11. Troubleshooting

### Erro: "FRONTEND_URL é obrigatório"

**Causa**: Variável `FRONTEND_URL` não está no `.env`

**Solução**:
```bash
nano .env
# Adicione: FRONTEND_URL=http://SEU_IP:3001
docker compose down && docker compose up -d
```

### Erro: "Connection refused" ao acessar no navegador

**Causa**: Portas não liberadas no firewall

**Solução**:
1. Verifique Security List na Oracle Cloud (Seção 6.1)
2. Verifique iptables no servidor (Seção 6.2)

### Erro: "Permission denied" no Docker

**Causa**: Usuário não está no grupo docker

**Solução**:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Container reiniciando em loop

**Causa**: Erro na aplicação

**Solução**:
```bash
# Ver logs do container com problema
docker compose logs backend
docker compose logs frontend

# Verificar se .env está correto
cat .env
```

### Servidor lento / Sem memória

**Causa**: Recursos insuficientes

**Solução**:
```bash
# Ver uso de memória
free -h

# Ver uso por container
docker stats

# Reiniciar containers para liberar memória
docker compose restart
```

---

## 📝 Checklist Final

- [ ] Conta Oracle Cloud criada e aprovada
- [ ] Instância VM criada (2 OCPUs, 12GB RAM)
- [ ] IP público anotado
- [ ] Conectado via SSH
- [ ] Docker e Git instalados
- [ ] Portas liberadas (Oracle Security List + iptables)
- [ ] Repositório clonado
- [ ] Arquivo `.env` configurado com IP público
- [ ] JWT_SECRET gerado com openssl
- [ ] `docker compose up -d --build` executado
- [ ] Sistema acessível em `http://SEU_IP:3001`
- [ ] Login realizado com sucesso
- [ ] Senha do admin alterada

---

## 🔗 Links Úteis

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Documentação Oracle Compute](https://docs.oracle.com/en-us/iaas/Content/Compute/home.htm)
- [Docker Documentation](https://docs.docker.com/)
- [Repositório Pub System](https://github.com/Hopereira/pub-system)

---

**Última atualização**: Dezembro 2024
