FROM node:12.13.0-alpine

WORKDIR /usr/app

COPY package.json ./

RUN yarn

COPY ./ /usr/app

RUN yarn run build

RUN rm ./node_modules -rf

RUN yarn install --production

CMD ["yarn", "run", "start"]


