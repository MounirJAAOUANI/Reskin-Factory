FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN node node_modules/typescript/bin/tsc && node node_modules/vite/bin/vite.js build

FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 4173
CMD ["sh", "-c", "node node_modules/vite/bin/vite.js preview --host 0.0.0.0 --port ${PORT:-4173}"]
