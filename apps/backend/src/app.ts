import { Effect, Runtime } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { validator } from "hono/validator";
import z from "zod";

import { WithHTTPLogger } from "./httpLogger";
import { CorsConfig } from "./lib/config/AppConfigSchema";
import type { YahooPriceRepository } from "./repositories/yahooPrice/YahooPriceRepository";
import { createPortfolioRouter } from "./routes/portfolio";
import type { TimeService } from "./services/time/time";
import type { YahooFinance } from "./services/yahooFinance";
import type { HonoEnv } from "./types";

const MetricSchema = z.object({
  name: z.string(),
  payload: z.any(),
});

const LoggerMiddlewareWithRuntime = ({ app }: { app: Hono<HonoEnv> }) =>
  Effect.gen(function* () {
    app.use("/*", async (c, next) => {
      const { method, path } = c.req;

      await WithHTTPLogger(
        c,
        Effect.gen(function* () {
          yield* Effect.logInfo(`[Request] ${method} ${path}`);

          yield* Effect.promise(next);

          yield* Effect.logInfo(
            `[Response] ${method} ${path} (${c.res.status})`,
          );
        }).pipe(Effect.withLogSpan("duration")),
      ).pipe(Runtime.runPromise(c.var.runtime));
    });
  });

export const createApp = Effect.gen(function* () {
  const corsConfig = yield* CorsConfig;

  const runtime = yield* Effect.runtime<
    TimeService | YahooPriceRepository | YahooFinance
  >();

  const app = new Hono<HonoEnv>();

  app.use(async (c, next) => {
    c.set("runtime", runtime);
    await next();
  });

  app.use("*", requestId());

  yield* LoggerMiddlewareWithRuntime({ app });

  app.get("/health", (c) => c.text("OK", 200));

  app.use(
    cors({
      origin: corsConfig.CORS_ORIGIN.toString(),
      exposeHeaders: ["X-Request-Id"],
    }),
  );

  const portfolioRouter = yield* createPortfolioRouter;
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
      await Runtime.runPromise(c.var.runtime)(
        WithHTTPLogger(c, Effect.logInfo(body)),
      );

      return c.text("OK", 200);
    },
  );

  return app;
});
