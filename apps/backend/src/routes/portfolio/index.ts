import { Hono } from "hono";
import { validator } from "hono/validator";
import z from "zod";

import { parseCSV } from "@xtb-analyser/xtb-csv-parser";
import { Effect, Runtime } from "effect";
import { init } from "excelize-wasm";
import { calculatePortfolioDailyValue } from "../../services/portfolio/calculatePortfolioDailyValue";
import { getDeposits } from "../../services/portfolio/getDeposits";
import { getWithdrawals } from "../../services/portfolio/getWithdrawals";
import type { HonoEnv } from "../../types";
import { addScoped } from "effect/Logger";
import { WithHTTPLogger } from "../../httpLogger";

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

    const effect = Effect.gen(function* () {
      const parsedCSV = yield* parseCSV(fileBytes, { excelize });

      const portfolioValueResult = yield* calculatePortfolioDailyValue(
        parsedCSV.cashOperations.successes,
      );

      const deposits = yield* getDeposits(parsedCSV.cashOperations.successes);
      const withdrawals = yield* getWithdrawals(
        parsedCSV.cashOperations.successes,
      );

      return c.json(
        { deposits, withdrawals, value: portfolioValueResult },
        200,
      );
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
    );

    const result = await Runtime.runPromise(c.var.runtime)(
      WithHTTPLogger(c, effect),
    );
    return result;
  });

  return portfolioRouter;
});
