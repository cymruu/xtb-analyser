import { Hono } from "hono";
import { validator } from "hono/validator";
import z from "zod";

import type { HonoEnv } from "../../types";
import { Effect, Logger, LogLevel } from "effect";
import { parseCSV } from "@xtb-analyser/xtb-csv-parser";
import { init } from "excelize-wasm";
import { createPortfolioService } from "../../services/portfolio";
import { YahooFinanceLive } from "../../services/yahooFinance";
import { YahooPriceRepositoryLive } from "../../repositories/yahooPrice/YahooPriceRepository";
import { TimeServiceLive } from "../../services/time/time";

const portfolioService = createPortfolioService();
export const portfolioRouter = new Hono<HonoEnv>();

const PortfolioSchemaV1 = z.object({
  volume: z.number(),
  market_value: z.number(),
  total_open_price: z.number(),
  market_price: z.number(),
  gross_profit: z.number(),
  symbol: z.string(),
  open_price: z.number(),
});

export const CreatePortfolioRequestBodySchema = z.discriminatedUnion(
  "schemaVersion",
  [
    z.object({
      schemaVersion: z.literal("1"),
      schema: z.array(PortfolioSchemaV1),
    }),
  ],
);

portfolioRouter.post(
  "/",
  validator("json", async (payload, c) => {
    const parseResult =
      await CreatePortfolioRequestBodySchema.safeParseAsync(payload);

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
    console.log("creating portfolio with body:", body);
    await c.var.services.portfolio.create(body);

    return c.json({ message: "Portfolio created" });
  },
);

portfolioRouter.post("/xtb-file", async (c) => {
  const excelize = await init("./node_modules/excelize-wasm/excelize.wasm.gz");

  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || !(file instanceof File)) {
    return c.body(null, 400);
  }

  const parsed = await Effect.runPromise(
    parseCSV(await file.bytes(), { excelize }),
  );

  const effect = portfolioService.calculatePortfolioDailyValue(
    parsed.cashOperations.successes,
  );

  const result = await Effect.runPromise(
    effect.pipe(
      Logger.withMinimumLogLevel(LogLevel.Debug),
      Effect.provide(YahooFinanceLive),
      Effect.provide(YahooPriceRepositoryLive),
      Effect.provide(TimeServiceLive),
    ),
  );

  return c.json(result);
});
