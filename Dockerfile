# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:24-slim AS builder

WORKDIR /app

# Client
COPY client/package*.json ./client/
RUN npm install --prefix client

COPY client/ ./client/
RUN npm run build --prefix client

# Server (all deps including devDeps for tsc)
COPY server/package*.json ./server/
RUN npm install --prefix server

COPY server/ ./server/
RUN npm run build --prefix server

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:24-slim

WORKDIR /app/server

# Production deps only
COPY server/package*.json ./
RUN npm install --omit=dev

# Compiled server
COPY --from=builder /app/server/dist ./dist

# Built client (served as static files by Express)
COPY --from=builder /app/client/dist ../client/dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "dist/index.js"]
