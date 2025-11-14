import { Effect } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { validator } from "hono/validator";
import z from "zod";

import { AppURL } from "./lib/config/AppConfigSchema";
import type { HonoEnv } from "./types";
import { portfolioRouter } from "./routes/portfolio";

const MetricSchema = z.object({
  name: z.string(),
  payload: z.any(),
});

const LoggerMiddlewareWithRuntime = ({ app }: { app: Hono<HonoEnv> }) =>
  Effect.gen(function* () {
    app.use("/*", async (c, next) => {
      const { method, path } = c.req;

      await Effect.gen(function* () {
        yield* Effect.logInfo(`[Request] ${method} ${path}`);

        yield* Effect.promise(next);

        yield* Effect.logInfo(`[Response] ${method} ${path} (${c.res.status})`);
      }).pipe(
        Effect.withSpan(`${method} ${path}`),
        Effect.withLogSpan("duration"),
        Effect.annotateLogs({ method, path }),
        Effect.runPromise,
      );
    });
  });

export const createApp = Effect.gen(function* () {
  const appUrl = yield* AppURL;

  const app = new Hono<HonoEnv>();

  yield* LoggerMiddlewareWithRuntime({ app });

  app.get("/health", (c) => c.text("OK", 200));

  app.use(cors({ origin: appUrl.toString() }));

  app.route("/portfolio", portfolioRouter);

  app.post(
    "/metrics",
    validator("json", async (payload, c) => {
      const parseResult = await MetricSchema.safeParseAsync(payload);

      if (!parseResult.success) {
        return c.json(
          { error: "Invalid request body", details: parseResult.error },
          400,
        );
      }
      return parseResult.data;
    }),
    async (c) => {
      const body = c.req.valid("json");
      console.log(body);
      return c.text("OK", 200);
    },
  );

  return app;
});
