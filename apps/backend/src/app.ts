import { Effect } from "effect";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { validator } from "hono/validator";
import z from "zod";

import { AppURL } from "./lib/config/AppConfigSchema";
import { portfolioRouter } from "./routes/portfolio";
import type { HonoEnv } from "./types";

const MetricSchema = z.object({
  name: z.string(),
  payload: z.any(),
});

export const createApp = Effect.gen(function* () {
  const appUrl = yield* AppURL;

  const app = new Hono<HonoEnv>();
  app.use(logger());

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
