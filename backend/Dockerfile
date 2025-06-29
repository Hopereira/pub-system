# ---- Base Stage ----
# Usa a imagem oficial do Node.js v18 como base.
FROM node:18-alpine AS base
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
# Instala apenas as dependências. Essa camada raramente muda.
FROM base AS dependencies
COPY package*.json ./
RUN npm install

# ---- Build Stage ----
# Copia as dependências já instaladas e constrói a aplicação.
FROM dependencies AS build
COPY . .
RUN npm run build

# ---- Production Stage ----
# Prepara a imagem final para produção, apenas com o necessário.
FROM base AS production
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
# Instala SOMENTE as dependências de produção.
RUN npm ci --omit=dev

# Comando para iniciar a aplicação.
CMD ["node", "dist/main"]