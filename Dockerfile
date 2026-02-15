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
# Stage 2: Runtime (shared base image + nginx)
# ============================================
FROM essensyshub/essensys-base:raspberry.2026.02

RUN apk add --no-cache nginx

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx : SPA routing + proxy vers backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Supprimer la config par defaut nginx
RUN rm -f /etc/nginx/http.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
