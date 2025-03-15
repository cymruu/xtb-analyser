FROM oven/bun:alpine AS base
FROM base as build_base
WORKDIR /tmp/build
COPY . .

FROM build_base AS build
RUN bun install --frozen-lockfile
RUN bun run build

FROM build AS prod_deps
RUN bun install --frozen-lockfile --production

FROM base AS app 
COPY --from=prod_deps /tmp/build/node_modules/ node_modules/
COPY --from=build /tmp/build/dist/ dist/
COPY --from=build /tmp/build/package.json .

USER bun
ENTRYPOINT [ "bun", "start" ]
