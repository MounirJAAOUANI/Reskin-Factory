FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_API_URL
ARG VITE_PASSWORD_REQUIRED
ARG VITE_TRUE_PASSWORD
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PASSWORD_REQUIRED=$VITE_PASSWORD_REQUIRED
ENV VITE_TRUE_PASSWORD=$VITE_TRUE_PASSWORD

RUN node node_modules/typescript/bin/tsc && node node_modules/vite/bin/vite.js build

FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
