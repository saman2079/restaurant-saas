FROM node:20-alpine AS builder

WORKDIR /app

RUN npm config set registry https://npm.arvancloud.ir

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN npm config set registry https://npm.arvancloud.ir

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

RUN mkdir -p uploads

EXPOSE 4000

CMD ["npm", "run", "start"]