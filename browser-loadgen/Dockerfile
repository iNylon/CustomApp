FROM mcr.microsoft.com/playwright:v1.52.0-jammy

WORKDIR /app

COPY package.json /app/package.json

RUN npm install --omit=dev

COPY runner.js /app/runner.js

CMD ["node", "/app/runner.js"]
