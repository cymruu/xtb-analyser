import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";

import { createApp } from "./app";
import { HTTPServerPort } from "./lib/config/AppConfigSchema";

class HTTPServer extends Effect.Service<HTTPServer>()("HTTPServer", {
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

BunRuntime.runMain(main.pipe(Effect.provide(HTTPServer.Default)));
