import { describe, it, expect } from "bun:test";

import {
  createCashOperationRow,
  createCashOperationRowV2,
} from "./tests/utils/createCashOperationRow.ts";
import {
  parseCashOperationRows,
  parseCashOperationRowsV2,
} from "./parseCashOperationRows.ts";
import { createXTBTimeString } from "../createXTBTestTime.ts";

describe("parseCashOperationRows", () => {
  it("should skip first 11 lines", () => {
    const result = parseCashOperationRows(
      Array.from({ length: 12 }).map((_, i) => createCashOperationRow(i)),
    );

    expect(result.error).toEqual(null);
    expect(result.result).toEqual([
      [
        "transaction_id: 11",
        "transaction_type: 11",
        "transaction_time: 11",
        "transaction_comment: 11",
        "transaction_symbol: 11",
        "transaction_amount: 11",
      ],
    ]);
  });

  it("should skip the first 11 lines and parse the rest", () => {
    const numberOfRows = 22;
    const expectedNumberOfParsedRows = 22 - 11;

    const rawRows = Array.from({ length: numberOfRows }).map((_, i) =>
      createCashOperationRow(i),
    );

    const result = parseCashOperationRows(rawRows);

    expect(result.error).toEqual(null);
    expect(result.result.length).toEqual(expectedNumberOfParsedRows);
    expect(result.result).toEqual(
      Array.from({ length: expectedNumberOfParsedRows }).map((_, i) => [
        `transaction_id: ${i + 11}`,
        `transaction_type: ${i + 11}`,
        `transaction_time: ${i + 11}`,
        `transaction_comment: ${i + 11}`,
        `transaction_symbol: ${i + 11}`,
        `transaction_amount: ${i + 11}`,
      ]),
    );
  });
});

describe("parseCashOperationRowsV2", () => {
  it("should parse valid rows", () => {
    const validRows = Array.from({ length: 11 }).map((_, i) =>
      createCashOperationRowV2(i),
    );

    const result = parseCashOperationRowsV2([
      ["123", "123", "123", "12", "312"],
      ...validRows,
      ["invalid"],
    ]);

    expect(result.error).toEqual(null);
    expect(result.result).toEqual(
      Array.from({ length: 11 }).map((_, i) => ({
        id: i,
        type: `deposit`,
        time: createXTBTimeString(i),
        comment: `transaction_comment: ${i}`,
        symbol: `transaction_symbol: ${i}`,
        amount: i,
      })),
    );
  });
});
