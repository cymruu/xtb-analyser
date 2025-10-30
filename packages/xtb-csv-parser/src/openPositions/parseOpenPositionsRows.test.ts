import { describe, expect, it } from "bun:test";
import { Effect } from "effect";

import { createOpenPositionRow } from "./tests/utils/createOpenPositionRow";
import { parseOpenPositionRows } from "./parseOpenPositionsRows";

describe("parseOpenPositionRows", () => {
  it("should return only valid rows", async () => {
    const result = await Effect.runPromise(
      parseOpenPositionRows([createOpenPositionRow(0)]),
    );

    expect(result.failures).toEqual([]);
    expect(result.successes).toEqual([
      {
        id: 0,
        market_price: 0,
        open_price: 0,
        open_time: new Date(0),
        profit: 0,
        purchase_value: 0,
        symbol: "position_symbol: 0",
        type: "BUY",
        volume: 1,
      },
    ]);
  });

  //TODO: test for reporting valid rows and errors

  describe("errors", () => {
    it("should return an error if no valid rows were passed", async () => {
      const result = await Effect.runPromise(
        parseOpenPositionRows([
          createOpenPositionRow(1, { type: "invalid_type" }),
        ]),
      );

      expect(result.failures.flatMap((x) => x.parseError.issues)).toMatchObject(
        [
          {
            code: "invalid_value",
            message: expect.any(String),
            path: ["type"],
            values: ["BUY"],
          },
        ],
      );
      expect(result.successes).toEqual([]);
    });
  });
});
