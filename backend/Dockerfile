# ============================================================
#  Dockerfile multi-étapes — Backend NestJS + Prisma
# ============================================================

# ---- Étape 1 : build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Dépendances (cache)
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Génération du client Prisma + build
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Étape 2 : runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Dépendances de production uniquement
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

# Artéfacts de build
COPY --from=builder /app/dist ./dist

EXPOSE 3000
# Applique les migrations puis démarre l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
