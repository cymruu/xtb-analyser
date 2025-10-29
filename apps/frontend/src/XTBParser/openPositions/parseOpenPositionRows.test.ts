import { describe, expect, it } from "bun:test";

import { parseOpenPositionRows } from "./parseOpenPositionRows.ts";
import { createOpenPositionRows } from "./test/utils/createOpenPositionRows.ts";

describe("parseOpenPositionRows", () => {
  it("should return only valid rows", () => {
    const rows = createOpenPositionRows(1);

    const result = parseOpenPositionRows(rows);

    expect(result.error).toBeNull();
    expect(result.result).toEqual([
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

  it("should return an error if no valid rows were passed", () => {
    const result = parseOpenPositionRows(createOpenPositionRows(0));

    expect(result.error).toEqual("No valid rows found");
    expect(result.result).toEqual([]);
  });
});
