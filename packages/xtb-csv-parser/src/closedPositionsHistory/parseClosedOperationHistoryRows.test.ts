import { describe, expect, it } from "bun:test";
import { Effect } from "effect";

import { createClosedPositionRow } from "./tests/utils/createClosedPositionRow";
import { parseClosedOperationHistoryRows } from "./parseClosedOperationHistoryRows";

describe("parseClosedPositionRows", () => {
  it("should return only valid rows", async () => {
    const result = await Effect.runPromise(
      parseClosedOperationHistoryRows([createClosedPositionRow(0)]),
    );

    expect(result.failures).toEqual([]);
    expect(result.successes).toEqual([
      {
        position: 0,
        symbol: "position_symbol: 0",
        type: "BUY",
        volume: 1,
        open_time: new Date(0),
        open_price: 0,
        close_time: new Date(0),
        close_price: 0,
        purchase_value: 0,
        sale_value: 0,
      },
    ]);
  });

  //TODO: test for reporting valid rows and errors

  describe("errors", () => {
    it("should return an error if no valid rows were passed", async () => {
      const result = await Effect.runPromise(
        parseClosedOperationHistoryRows([
          createClosedPositionRow(1, { type: "invalid_type" }),
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
