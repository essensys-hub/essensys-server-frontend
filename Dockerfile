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
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuration Nginx : SPA routing + proxy vers backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
