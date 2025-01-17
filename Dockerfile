FROM node:alpine

WORKDIR /app

COPY ./redirectmanager .

RUN npm install

CMD ["npm", "start"]