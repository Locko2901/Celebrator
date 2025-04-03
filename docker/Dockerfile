FROM node:20-alpine

WORKDIR /home/celebrator

COPY . .

RUN npm install && npm install -g pm2

RUN pm2 install pm2-logrotate

RUN node src/deploy-commands.js

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
