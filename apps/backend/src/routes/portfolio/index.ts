import { Hono } from "hono";
import { validator } from "hono/validator";
import z from "zod";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";
import { Effect, Runtime } from "effect";
import { init } from "excelize-wasm";
import type { YahooPriceRepository } from "../../repositories/yahooPrice/YahooPriceRepository";
import { calculatePortfolioDailyValue } from "../../services/portfolio/calculatePortfolioDailyValue";
import type { TimeService } from "../../services/time/time";
import type { YahooFinance } from "../../services/yahooFinance";
import type { HonoEnv } from "../../types";

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

export const createPortfolioRouter = Effect.gen(function* () {
  const portfolioRouter = new Hono<HonoEnv>();

  const runtime = yield* Effect.runtime<
    TimeService | YahooPriceRepository | YahooFinance
  >();

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
    const excelize = await init(
      "./node_modules/excelize-wasm/excelize.wasm.gz",
    );

    const body = await c.req.parseBody();
    const file = body["file"];
    if (!file || !(file instanceof File)) {
      return c.body(null, 400);
    }

    const fileBytes = await file.bytes();

    return Effect.gen(function* () {
      const parsedCSV = yield* parseCSV(fileBytes, { excelize });

      const result = yield* calculatePortfolioDailyValue(
        parsedCSV.cashOperations.successes,
      );

      return c.json(result, 200);
    }).pipe(
      Effect.tapError(Effect.logError),
      Effect.catchTags({
        CSVParsingError: () =>
          Effect.succeed(
            c.json(
              {
                success: false,
                message: "CSVParsingError",
              },
              400,
            ),
          ),
        HeaderParsingError: () => {
          return Effect.succeed(
            c.json(
              {
                success: false,
                message: "Header parsing error",
              },
              400,
            ),
          );
        },
        DatabaseError: () => {
          return Effect.succeed(
            c.json(
              {
                success: false,
                message: "DatabaseError",
              },
              500,
            ),
          );
        },
      }),
      Runtime.runPromise(runtime),
    );
  });

  return portfolioRouter;
});
