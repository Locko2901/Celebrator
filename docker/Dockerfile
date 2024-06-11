FROM node:20

WORKDIR /home/Celebrator

COPY package*.json ./

RUN npm install && npm install -g pm2

COPY . .

RUN node src/deploy-commands.js

CMD /bin/bash -c "node src/deploy-commands.js && pm2-runtime start ecosystem.config.js"