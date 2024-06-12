FROM node:20

WORKDIR /home/Celebrator

COPY package*.json ./

RUN npm install && npm install -g pm2

RUN pm2 install pm2-logrotate

COPY . .

RUN node src/deploy-commands.js

CMD ["pm2-runtime", "start", "ecosystem.config.js"]