FROM node:24-slim

WORKDIR /app

# Install client deps and build
COPY client/package*.json ./client/
RUN npm install --prefix client

COPY client/ ./client/
RUN npm run build --prefix client

# Install server deps
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

COPY server/ ./server/
RUN npm run build --prefix server

# Runtime
WORKDIR /app/server
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001
CMD ["node", "dist/index.js"]
