# syntax=docker/dockerfile:1.6
FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/worker ./apps/worker

RUN pnpm install --filter @agentops/worker... --ignore-scripts --no-frozen-lockfile
RUN pnpm --filter @agentops/worker build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=base /app /app

CMD ["pnpm", "--filter", "@agentops/worker", "start"]
