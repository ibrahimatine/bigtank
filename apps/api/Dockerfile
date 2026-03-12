FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app

# --- Install all deps ---
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY packages/shared-config/package.json packages/shared-config/
RUN pnpm install --frozen-lockfile

# --- Copy source and build ---
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN pnpm db:generate
RUN pnpm --filter @samadal/shared-types build
RUN pnpm --filter @samadal/shared-utils build
RUN pnpm --filter @samadal/database build
RUN pnpm --filter api build

# --- Production image ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built output + node_modules from monorepo
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./dist
COPY --from=base /app/apps/api/package.json ./
COPY --from=base /app/packages/database/prisma ./prisma
COPY --from=base /app/packages/database/dist ./packages/database/dist
COPY --from=base /app/packages/database/package.json ./packages/database/
COPY --from=base /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=base /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=base /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=base /app/packages/shared-utils/package.json ./packages/shared-utils/

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema ./prisma/schema.prisma && node dist/main.js"]
