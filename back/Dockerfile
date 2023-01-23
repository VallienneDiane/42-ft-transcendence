FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./
RUN ls -al
# RUN npm install glob rimraf
# RUN npm install --only=development
RUN npm install -g npm@9.3.1

COPY ./ ./
# RUN npm run build

CMD ["npm", "run", "start"]