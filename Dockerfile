
# Stage 1: Build the Vite app
FROM node:22 AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Serve static files
FROM node:22
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
