FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
RUN corepack enable
RUN npm config set registry https://registry.npmmirror.com

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
COPY packages/contracts packages/contracts
ENV DATABASE_URL=mysql://placeholder:placeholder@mysql:3306/baby_companion
ENV SHADOW_DATABASE_URL=mysql://placeholder:placeholder@mysql:3306/baby_companion_shadow
RUN pnpm --filter @baby-companion/api build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/package.json apps/api/package.json
COPY --from=build /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/src/generated apps/api/src/generated
COPY --from=build /app/packages/contracts packages/contracts

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
