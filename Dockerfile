FROM node:10-alpine AS build-env
WORKDIR /out
COPY package.json .
RUN npm i
COPY . .
RUN ls -al 

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build-env /out .