FROM node:10-alpine AS build-env
WORKDIR /out
COPY package.json .
RUN npm i
COPY . .

FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build-env /out .
EXPOSE 80