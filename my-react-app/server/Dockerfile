# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# install deps first (better caching)
COPY package*.json ./
RUN npm ci

# copy the rest
COPY . .


EXPOSE 3001
CMD ["node", "server.js"]