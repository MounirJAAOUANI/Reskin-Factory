FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN node node_modules/typescript/bin/tsc && node node_modules/vite/bin/vite.js build

FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
