FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

RUN echo "===== node_modules/.bin =====" \
 && ls -la node_modules/.bin || true

RUN echo "===== typescript =====" \
 && ls -la node_modules/typescript || true

RUN npm ls typescript || true

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

RUN mkdir -p uploads

EXPOSE 4000

CMD ["npm", "run", "start"]