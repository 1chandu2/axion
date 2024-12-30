FROM node:20-alpine

LABEL maintainer="Chandra Prakash"
LABEL version="1.0"
LABEL description="Dockerfile to run a nodejs app"
LABEL usage="docker build -t <image-name> ."
LABEL usage="docker run -p 5111:5111 <image-name>"

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5111

CMD ["npm", "start"]