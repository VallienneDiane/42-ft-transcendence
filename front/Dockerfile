############## FRONT-END REACT VITE ################
FROM node:latest
WORKDIR /usr/src/app
RUN npm install -g npm@latest
COPY react.sh .
EXPOSE 8000
CMD ["sh", "react.sh"]