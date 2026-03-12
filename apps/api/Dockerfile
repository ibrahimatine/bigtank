FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# Install deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY packages/shared-config/package.json packages/shared-config/
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm db:generate
RUN pnpm --filter @samadal/shared-types build
RUN pnpm --filter @samadal/shared-utils build
RUN pnpm --filter @samadal/database build
RUN pnpm --filter api build

RUN npm install -g prisma@6.19.2

ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "cd packages/database && prisma migrate deploy && cd /app && node apps/api/dist/main.js"]
