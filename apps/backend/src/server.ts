import { BunRuntime } from "@effect/platform-bun";
import { Effect, Layer, ManagedRuntime } from "effect";

import { createApp } from "./app";
import { HTTPServerPort } from "./lib/config/AppConfigSchema";
import { TimeServiceLive } from "./services/time/time";
import { YahooFinanceLive } from "./services/yahooFinance";
import { YahooPriceRepositoryLive } from "./repositories/yahooPrice/YahooPriceRepository";

export class HTTPServer extends Effect.Service<HTTPServer>()("HTTPServer", {
  effect: Effect.gen(function* () {
    const app = yield* createApp;
    return app;
  }),
}) {}

const main = Effect.gen(function* () {
  const app = yield* HTTPServer;
  const port = yield* HTTPServerPort;

  Bun.serve({ fetch: app.fetch, port });

  yield* Effect.logInfo(`Server listening on port ${port} hono`);
});

export const MainLayerLive = Layer.mergeAll(
  TimeServiceLive,
  YahooPriceRepositoryLive.pipe(Layer.provide(TimeServiceLive)),
  YahooFinanceLive,
);

export const MainRuntime = ManagedRuntime.make(MainLayerLive);

BunRuntime.runMain(main.pipe(Effect.provide(HTTPServer.Default)));
