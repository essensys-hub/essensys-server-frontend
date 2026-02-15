# ============================================
# Stage 1: Build React app
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================
# Stage 2: Image avec les fichiers statiques
# ============================================
FROM essensyshub/essensys-base:raspberry.2026.02

COPY --from=builder /app/dist /var/www/html

VOLUME ["/var/www/html"]

CMD ["echo", "Frontend static files in /var/www/html"]
