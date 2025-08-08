import { describe, it, expect } from "bun:test";

import { processRows } from "./processRows.ts";
import { ParsedCashOperationRow } from "../../XTBParser/cashOperationHistory/parseCashOperationRows.ts";

describe("portfolio-performance", () => {
  describe("processRows", () => {
    const rows: ParsedCashOperationRow[] = [
      {
        id: 0,
        type: "deposit",
        time: new Date(0),
        comment: "",
        symbol: "",
        amount: 0,
      },
      {
        id: 1,
        type: "invalid_type", //unknown type
        time: new Date(1),
        comment: "",
        symbol: "",
        amount: 0,
      },
    ];

    const result = processRows(rows);
    console.log(result);
  });
});
