FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

# Create logs directory and set permissions BEFORE copying compiled code
RUN mkdir -p /usr/src/app/dist/logs && chown -R node:node /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist

USER node

EXPOSE 4003

CMD ["node", "dist/server.js"]