# --- Stage 1: Build the app ---
FROM node:22 AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build the static files
COPY . .
RUN npm run build

# --- Stage 2: Serve the app with Nginx ---
FROM nginx:alpine

# 1. Copy the 'dist' folder from the builder stage to Nginx's public folder
COPY --from=builder /app/dist /usr/share/nginx/html

# 2. Configure Nginx to listen on port 8080 (Cloud Run's default)
# and ensure that all routes point to index.html (crucial for React/Vue/Vite SPAs)
RUN printf 'server {\n\
    listen 8080;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# 3. Expose the port and start Nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
