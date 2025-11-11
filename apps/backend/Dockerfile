FROM oven/bun:alpine AS base

FROM base AS build_base
WORKDIR /tmp/build/
COPY . .

FROM build_base AS build
RUN bun install --frozen-lockfile
RUN cd ./apps/backend/ && bunx prisma generate 

FROM build_base as prod
RUN bun install --frozen-lockfile --production

FROM base AS app
WORKDIR /home/bun/app/
COPY --from=prod /tmp/build/apps/backend/node_modules/ node_modules/
COPY --from=build /tmp/build/apps/backend/src/ src/
COPY --from=build /tmp/build/apps/backend/package.json .

USER bun
CMD ["/bin/sh"]
ENTRYPOINT [ "bun", "start" ]
