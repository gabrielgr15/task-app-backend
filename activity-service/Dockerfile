FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache curl

COPY package*.json ./
RUN npm ci

COPY . .

# Build TypeScript to JavaScript
RUN npm run build

EXPOSE 3003

# Run the compiled JavaScript, not TypeScript
CMD ["npm", "run", "start"]