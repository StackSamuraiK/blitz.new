FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# Build the TypeScript project
RUN npx tsc -b

EXPOSE 3000

# Run the compiled application
CMD [ "node", "dist/index.js" ]
