FROM node:22 AS builder
WORKDIR /app

# Step A: Copy ONLY the package files
COPY package*.json ./

# Step B: Install dependencies (this creates a "Linux-native" node_modules)
RUN npm install

# Step C: NOW copy your source code
COPY . .

# Step D: Build
RUN npm run build
