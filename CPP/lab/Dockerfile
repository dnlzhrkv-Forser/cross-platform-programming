FROM node:20-alpine
LABEL maintainer="Жарков Данило"
LABEL version="1.0"
LABEL description="ФармаЛайф — REST API інтернет-аптеки (Express + MongoDB), ЛР №2"
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=3000
EXPOSE 3000
USER node
CMD ["node", "server.js"]