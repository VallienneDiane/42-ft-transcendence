############### BACK-END NEST JS #################
FROM node:latest
WORKDIR /usr/src/app
RUN npm install -g npm@9.3.1 && npm install -g @nestjs/cli
COPY nest.sh .
RUN npm i --save class-validator class-transformer
EXPOSE 3000
CMD ["sh", "nest.sh"]