import { Effect } from "effect";
import { HTTPServerPort } from "./lib/config/AppConfigSchema";
import { createApp } from "./app";
import { BunRuntime } from "@effect/platform-bun";

class HTTPServer extends Effect.Service<HTTPServer>()("HTTPServer", {
  effect: Effect.gen(function* () {
    const app = yield* createApp;
    return app;
  }),

  dependencies: [],
}) {}

const main = Effect.gen(function* () {
  const app = yield* HTTPServer;
  const port = yield* HTTPServerPort;

  Bun.serve({ fetch: app.fetch, port });

  yield* Effect.logInfo(`Server listening on port ${port} hono`);
});

BunRuntime.runMain(main.pipe(Effect.provide(HTTPServer.Default)));
