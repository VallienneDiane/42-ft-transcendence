FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@9.3.1
RUN npm install

COPY ./ ./

EXPOSE 8000

CMD ["npm", "run", "dev"]