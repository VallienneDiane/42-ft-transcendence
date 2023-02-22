############### BACK-END NEST JS #################
FROM node:latest
WORKDIR /usr/src/app
RUN npm install latest-version && npm install -g @nestjs/cli
COPY nest.sh .
EXPOSE 3000
CMD ["sh", "nest.sh"]