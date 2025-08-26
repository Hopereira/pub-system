# Usar uma imagem base do Node.js na versão LTS (Long Term Support)
FROM node:20-alpine

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copiar os arquivos de gerenciamento de pacotes
COPY package*.json ./

# Instalar as dependências do projeto
RUN npm install

# Copiar o restante do código da aplicação para o diretório de trabalho
COPY . .

# Expor a porta que o Next.js usa por padrão
EXPOSE 3000

# O comando para iniciar a aplicação em modo de desenvolvimento
CMD ["npm", "run", "dev"]