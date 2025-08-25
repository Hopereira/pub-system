# Dockerfile de Desenvolvimento

# 1. Define a imagem base com a versão correta do Node.js
FROM node:20-alpine

# 2. Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# 3. Copia os arquivos de definição de pacotes
COPY package*.json ./

# 4. Instala todas as dependências (incluindo as de desenvolvimento)
RUN npm install

# 5. Copia todo o resto do código-fonte
COPY . .

# 6. Comando para iniciar a aplicação em modo de desenvolvimento (com watch mode)
CMD ["npm", "run", "start:dev"]