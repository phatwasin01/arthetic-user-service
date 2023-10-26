# Version 4
FROM node:18-bullseye-slim 
WORKDIR /app
RUN npm install -g pnpm
COPY . .
COPY wait-for.sh wait-for.sh

RUN pnpm install
RUN pnpx prisma generate
RUN pnpm build

# FROM node:18-bullseye-slim AS final
# WORKDIR /app
# RUN npm install -g pnpm
# COPY --from=builder ./app/dist ./dist
# COPY package.json .
# COPY pnpm-lock.yaml .
# RUN pnpm install --production
# RUN pnpx prisma generate

EXPOSE 4000
CMD [ "pnpm", "start:migrate" ]