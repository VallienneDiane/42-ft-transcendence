FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./
RUN ls -al
# RUN npm install glob rimraf
# RUN npm install --only=development
RUN npm install

COPY ./ ./
# RUN npm run build

CMD ["npm", "run", "start"]