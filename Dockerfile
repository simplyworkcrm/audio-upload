FROM node:22 AS builder
WORKDIR /app

# 1. Copy only the package files first
COPY package*.json ./

# 2. Install dependencies (this creates a clean, Linux-compatible node_modules)
RUN npm install

# 3. Copy the rest of your source code
COPY . .

# 4. Build the app
RUN npm run build
