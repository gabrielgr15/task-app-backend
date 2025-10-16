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

# Copy deps as root, then chown before app copy
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
RUN chown -R node:node /usr/src/app  # Own node_modules early

# Copy built app with ownership baked in (key change!)
COPY --from=builder --chown=node:node /usr/src/app/dist ./dist

# Switch to node *before* creating runtime dirs
USER node

# Now as node: create logs (self-owned, writable, no chown needed)
RUN mkdir -p dist/logs

# Optional: Explicit modes for paranoia (owner rwx recursive)
RUN chmod -R u+rwX /usr/src/app

EXPOSE 4003
CMD ["node", "dist/server.js"]