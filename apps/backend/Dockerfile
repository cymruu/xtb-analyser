FROM oven/bun:alpine AS base
FROM base AS build_base
WORKDIR /tmp/build/
COPY . .

FROM build_base AS build
RUN bun install --frozen-lockfile
RUN cd ./apps/backend/ && bun run build

FROM base AS app
WORKDIR /home/bun/app/
COPY --from=build /tmp/build/apps/backend/dist/ dist/
COPY --from=build /tmp/build/apps/backend/package.json .
RUN bun install --frozen-lockfile --production

USER bun
ENTRYPOINT [ "bun", "start" ]
