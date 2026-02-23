# Estágio de Build
FROM node:22-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
# Instalando com --legacy-peer-deps para evitar erros de versão de bibliotecas
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Estágio de Produção
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]