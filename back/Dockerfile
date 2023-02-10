############### BACK-END NEST JS #################
FROM node:latest
WORKDIR /usr/src/app
COPY nest.sh .
RUN npm install -g npm@9.3.1 && npm install -g @nestjs/cli
EXPOSE 3000
CMD ["sh", "nest.sh"]