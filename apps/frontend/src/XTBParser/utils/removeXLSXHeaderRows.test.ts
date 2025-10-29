import { describe, expect, it } from "bun:test";

import { removeXLSXHeaderColumns } from "./removeXLSXHeaderRows.ts";

describe("removeXSLXHeaderRows", () => {
  it("should remove first 11 rows", () => {
    const result = removeXLSXHeaderColumns(
      Array.from({ length: 12 }).map((_, i) => [`${i}`]),
    );

    expect(result).toEqual([["11"]]);
  });

  it("should return an empty array if contains only header", () => {
    const result = removeXLSXHeaderColumns(
      Array.from({ length: 11 }).map((_, i) => [`${i}`]),
    );

    expect(result).toEqual([]);
  });
});
