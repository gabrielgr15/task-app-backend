FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3003

CMD ["npm", "run", "dev"]