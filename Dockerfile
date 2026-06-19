FROM node:24-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.26.1

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.base.json tsconfig.json ./

COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/

RUN pnpm install --frozen-lockfile

RUN pnpm run typecheck:libs

RUN pnpm --filter @workspace/api-server run build

FROM node:24-slim AS runner

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
