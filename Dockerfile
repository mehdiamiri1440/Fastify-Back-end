FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app


ARG VERSION=0.0.0
ENV VERSION=$VERSION

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# building code for production
RUN npm ci --omit=dev

# Bundle app source
COPY . .

EXPOSE 3003

CMD [ "node", "-r", "ts-node/register", "-r", "module-alias/register", "main.ts" ]
