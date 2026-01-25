FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Install build tools
RUN apt-get update && apt-get install -y build-essential python3 && rm -rf /var/lib/apt/lists/*

# Copy package metadata and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false --no-audit --no-fund

# Copy project
COPY . .

# Build project (Next build + ts compile where applicable)
RUN npm run build || true

ENV NODE_ENV=production

# Entrypoint: run the TypeScript worker using ts-node
CMD ["npx", "ts-node", "scripts/analysis-worker.ts"]
