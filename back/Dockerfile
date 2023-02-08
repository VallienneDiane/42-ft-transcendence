############### BACK-END NEST JS #################
FROM node:latest
WORKDIR /usr/src/app
RUN npm install -g npm@9.3.1 && npm install -g @nestjs/cli
RUN npm i --save class-validator class-transformer
COPY nest.sh .
EXPOSE 3000
CMD ["sh", "nest.sh"]