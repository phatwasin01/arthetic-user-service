# Version 4
FROM node:18-bullseye-slim as builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
COPY wait-for.sh wait-for.sh

RUN pnpm install
RUN pnpx prisma generate
RUN pnpm build

FROM node:18-alpine AS final
WORKDIR /app
RUN apk add --update --no-cache openssl1.1-compat curl
RUN npm install -g pnpm
COPY --from=builder ./app/dist ./dist
COPY --from=builder ./app/prisma ./prisma
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --production

ENV NODE_ENV production
EXPOSE 4000

CMD [ "pnpm", "start:migrate" ]