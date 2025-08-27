# 1. Usar uma imagem baseada em Debian (Node 20) para máxima compatibilidade
FROM node:20

# --- ADICIONE ESTA SEÇÃO ---
# 2. Instala as dependências do sistema necessárias para o Cypress rodar no Debian
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb
# -------------------------

# 3. Definir o diretório de trabalho
WORKDIR /app

# 4. Copiar os arquivos de definição de pacotes
COPY package*.json ./

# 5. Instalar todas as dependências do projeto
RUN npm install

# 6. Copiar todo o resto do código-fonte
COPY . .

# 7. Comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "run", "dev"]