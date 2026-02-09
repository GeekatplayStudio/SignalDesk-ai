# syntax=docker/dockerfile:1.6
FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN pnpm install --filter @agentops/web... --ignore-scripts --no-frozen-lockfile
RUN pnpm --filter @agentops/web build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=base /app /app

EXPOSE 3000
CMD ["pnpm", "--filter", "@agentops/web", "start"]
