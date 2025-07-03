FROM node:18

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD ["node", "index.js"]

