import { Context, Hono, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { logger } from "hono/logger";
import { IServices } from "./services";
import { HonoEnv } from "./types";

export const useServices = (services: IServices) =>
  createMiddleware<HonoEnv>(async (c: Context<HonoEnv>, next: Next) => {
    c.set("services", services);
    await next();
  });

export const createApp = (services: IServices) => {
  const app = new Hono<HonoEnv>();
  app.use(logger());
  app.use(useServices(services));

  app.get("/health", (c) => c.text("OK", 200));

  return app;
};
