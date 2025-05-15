## Etapa de dependencias
FROM node:22.15.0-alpine AS deps

# En Alpine puede ser necesario libc6-compat para ciertas dependencias nativas
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiamos package.json y package-lock.json para usar npm ci
COPY package.json package-lock.json ./
RUN npm ci

## Etapa de build
FROM node:22.15.0-alpine AS builder
WORKDIR /app

# Traemos node_modules desde deps
COPY --from=deps /app/node_modules ./node_modules
# Copiamos todo el proyecto
COPY . .
# Ejecutamos el build con npm
RUN npm run build

## Etapa de producción
FROM node:22.15.0-alpine AS runner
WORKDIR /usr/src/app

# Copiamos archivos para instalar solo producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copiamos la carpeta de salida del build
COPY --from=builder /app/dist ./dist

# Expone puerto si fuera necesario (ej: Next.js usa 3000)
# EXPOSE 3000

# Lanzamos la aplicación
CMD ["node", "dist/main"]