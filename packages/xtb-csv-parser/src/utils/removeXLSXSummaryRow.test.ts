import { describe, expect, it } from "bun:test";

import { removeXLSXSummaryRow } from "./removeXLSXSummrayRow.ts";

describe("removeXLSXSummaryRow", () => {
  it("should remove last row", () => {
    const result = removeXLSXSummaryRow(
      Array.from({ length: 2 }).map((_, i) => [`${i}`]),
    );

    expect(result).toEqual([["0"]]);
  });
});
