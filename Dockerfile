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

COPY --from=builder --chown=1000:1000 /app/dist /var/www/html

VOLUME ["/var/www/html"]

# Run as non-root (Trivy DS-0002). No server runs here: the stage only exposes
# the built static files via the volume, so no privileged port is required.
USER 1000:1000

CMD ["echo", "Frontend static files in /var/www/html"]
