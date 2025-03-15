FROM oven/bun:alpine AS base
FROM base as build_base
WORKDIR /tmp/build
COPY . .

FROM build_base AS build
RUN bun install --frozen-lockfile
RUN cd apps/backend/ && bun run build

FROM build_base AS prod_deps
RUN bun install --frozen-lockfile --production

FROM base AS app 
COPY --from=prod_deps /tmp/build/node_modules/ node_modules/
COPY --from=build /tmp/build/apps/backend/dist/ .
COPY --from=build /tmp/build/apps/backend/package.json .

USER bun
ENTRYPOINT [ "bun", "run", "main.js" ]
