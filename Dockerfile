FROM node:18-alpine

WORKDIR /voice-generator
COPY package.json package-lock.json /voice-generator/
RUN npm install --production

COPY . /voice-generator

ARG AWS_ACCESS_KEY_ID='REPLACE_ME' 
ENV AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} 

ARG AWS_SECRET_ACCESS_KEY='REPLACE_ME' 
ENV AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} 


EXPOSE 8600

CMD ["node", "."]