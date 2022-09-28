FROM node:16-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY config.json start.js ./

CMD node --inspect=0.0.0.0:9229 start.js
