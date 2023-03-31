############## FRONT-END REACT VITE ################
FROM node:latest
WORKDIR /usr/src/app
RUN npm install -g npm@9.3.1
COPY react.sh .
EXPOSE 8000
CMD ["sh", "react.sh"]