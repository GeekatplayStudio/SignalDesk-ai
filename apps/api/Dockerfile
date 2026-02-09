# syntax=docker/dockerfile:1.6
FROM node:20-slim AS base
WORKDIR /app

# Enable corepack/pnpm
RUN corepack enable

# Copy workspace files
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --filter @agentops/api... --ignore-scripts --no-frozen-lockfile
RUN pnpm --filter @agentops/api build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

COPY --from=base /app /app

EXPOSE 3001
CMD ["pnpm", "--filter", "@agentops/api", "start"]
