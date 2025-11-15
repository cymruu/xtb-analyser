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
COPY --from=prod /tmp/build/node_modules/ ./node_modules/
COPY --from=prod /tmp/build/apps/backend/src/ ./apps/backend/src/
COPY --from=prod /tmp/build/apps/backend/package.json ./apps/backend/
COPY --from=prod /tmp/build/apps/backend/node_modules/ ./apps/backend/node_modules/

COPY --from=build /tmp/build/packages/xtb-csv-parser/src/ ./packages/xtb-csv-parser/src/
COPY --from=build /tmp/build/packages/xtb-csv-parser/package.json ./packages/xtb-csv-parser/
COPY --from=build /tmp/build/packages/xtb-csv-parser/node_modules/ ./packages/xtb-csv-parser/node_modules/

WORKDIR /home/bun/app/apps/backend/
USER bun
CMD ["/bin/sh"]
ENTRYPOINT [ "bun", "start" ]
