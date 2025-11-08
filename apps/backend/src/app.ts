import { type Context, Hono, type Next } from "hono";
import { createMiddleware } from "hono/factory";
import { logger } from "hono/logger";
import z from "zod";

import type { IServices } from "./services";
import type { HonoEnv } from "./types";
import { validator } from "hono/validator";
import { cors } from "hono/cors";

export const useServices = (services: IServices) =>
  createMiddleware<HonoEnv>(async (c: Context<HonoEnv>, next: Next) => {
    c.set("services", services);
    await next();
  });

const MetricSchema = z.object({
  name: z.string(),
  payload: z.any(),
});

export const createApp = (services: IServices) => {
  const app = new Hono<HonoEnv>();
  app.use(logger());
  app.use(useServices(services));

  app.get("/health", (c) => c.text("OK", 200));

  app.use(cors({ origin: "https://dev.xtb-analyser.com" }));

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
};
