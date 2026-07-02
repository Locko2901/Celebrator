FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist/ dist/
COPY COMMIT_SHA* ./
RUN mkdir -p data && chown -R node:node /app
USER node

CMD ["node", "dist/main.js"]
