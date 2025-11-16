import { describe, expect, it } from "bun:test";
import { Effect } from "effect";
import { createXTBTimeString } from "../createXTBTestTime";
import { parseCashOperationRows } from "./parseCashOperationHistoryRows";
import { createCashOperationRowV2 } from "./tests/utils/createCashOperationRowV2";

const ReportableZodIssueInternalCode = "REPORTABLE_ISSUE";

describe("parseCashOperationRowsV3", () => {
  it("should parse valid rows", async () => {
    const validRows = Array.from({ length: 11 }).map((_, i) =>
      createCashOperationRowV2(i),
    );

    const result = await Effect.runPromise(parseCashOperationRows(validRows));

    expect(result.successes).toEqual(
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

  it("should parse valid rows and return errors for invalid ones", async () => {
    const validRows = [
      ...Array.from({ length: 11 }).map((_, i) => createCashOperationRowV2(i)),
      createCashOperationRowV2(12, { type: "invalid_type" }),
    ];

    const result = await Effect.runPromise(parseCashOperationRows(validRows));

    expect(result.successes).toEqual(
      Array.from({ length: 11 }).map((_, i) => ({
        id: i,
        type: `deposit`,
        time: createXTBTimeString(i),
        comment: `transaction_comment: ${i}`,
        symbol: `transaction_symbol: ${i}`,
        amount: i,
      })),
    );

    expect(result.failures.flatMap((x) => x.parseError.issues)).toMatchObject([
      {
        internal_code: ReportableZodIssueInternalCode,
        value: "invalid_type",
        code: "invalid_value",
        path: ["type"],
        values: expect.any(Array),
        message: expect.any(String),
      },
    ]);
  });

  describe("errors", () => {
    it("should return an error if type is invalid", async () => {
      const rows = [createCashOperationRowV2(1, { type: "invalid_type" })];
      const result = await Effect.runPromise(parseCashOperationRows(rows));

      expect(result.successes).toEqual([]);

      expect(result.failures).toHaveLength(1);
      expect(result.failures.flatMap((x) => x.parseError.issues)).toMatchObject(
        [
          {
            internal_code: ReportableZodIssueInternalCode,
            value: "invalid_type",
            code: "invalid_value",
            path: ["type"],
            values: expect.any(Array),
            message: expect.any(String),
          },
        ],
      );
    });

    it("should collect all errors", async () => {
      const rows = [
        createCashOperationRowV2(1, { type: "invalid_type" }),
        createCashOperationRowV2(1, { type: "invalid_type" }),
      ];
      const result = await Effect.runPromise(parseCashOperationRows(rows));

      expect(result.successes).toEqual([]);
      expect(result.failures).toHaveLength(2);
      expect(result.failures.flatMap((x) => x.parseError.issues)).toMatchObject(
        [
          {
            internal_code: ReportableZodIssueInternalCode,
            value: "invalid_type",
            code: "invalid_value",
            path: ["type"],
            values: expect.any(Array),
            message: expect.any(String),
          },
          {
            internal_code: ReportableZodIssueInternalCode,
            value: "invalid_type",
            code: "invalid_value",
            path: ["type"],
            values: expect.any(Array),
            message: expect.any(String),
          },
        ],
      );
    });
  });
});
