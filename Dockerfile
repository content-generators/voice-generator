FROM node:18-alpine

WORKDIR /voice-generator
COPY package.json package-lock.json /voice-generator/
RUN npm install --production

COPY . /voice-generator

EXPOSE 8600

CMD ["node", "."]