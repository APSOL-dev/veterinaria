# Stage 1: Build production React Vite bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments for Vite environment variables
ARG VITE_SUPABASE_URL=https://cjqziapqtyjsxqxumgbx.supabase.co
ARG VITE_SUPABASE_ANON_KEY=sb_publishable_Iaft7FBP4BW0vbXlYzaP-g_jtyFue87

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full repository source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve static files with lightweight Nginx
FROM nginx:alpine

# Clean default Nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built dist files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA Routing configuration for Nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
