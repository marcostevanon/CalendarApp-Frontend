FROM node:10-alpine AS build-env
WORKDIR /out
COPY package.json .
RUN npm i
COPY . .

FROM nginx:alpine
WORKDIR /home/app
COPY --from=build-env /out /usr/share/nginx/html