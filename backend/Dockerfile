# Dockerfile de Desenvolvimento

# 1. Define a imagem base com a versão correta do Node.js
FROM node:20-alpine

# 2. Instala dependências necessárias para compilar bcrypt e outras libs nativas
RUN apk add --no-cache python3 make g++ && ln -sf python3 /usr/bin/python

# 3. Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# 4. Copia os arquivos de definição de pacotes
COPY package*.json ./

# 5. Instala todas as dependências (incluindo as de desenvolvimento)
# A flag --force é necessária devido a conflitos de versão entre as dependências
RUN npm install --force

# 6. Copia todo o resto do código-fonte
COPY . .

# 7. Comando para iniciar a aplicação em modo de desenvolvimento (com watch mode)
CMD ["npm", "run", "start:dev"]