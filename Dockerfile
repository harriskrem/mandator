FROM node:22-alpine AS build

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && yarn install --immutable

COPY . .

ARG VITE_SIGNAL_SERVER_URL
ENV VITE_SIGNAL_SERVER_URL=$VITE_SIGNAL_SERVER_URL

RUN yarn build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
