# 1. Usar imagem Alpine para dev (mais leve)
FROM node:20-alpine

# 2. Definir o diretório de trabalho
WORKDIR /app

# 3. Copiar os arquivos de definição de pacotes
COPY package*.json ./

# 4. Instalar todas as dependências do projeto
RUN npm install

# 6. Copiar todo o resto do código-fonte
COPY . .

# 7. Comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "run", "dev"]