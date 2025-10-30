import { describe, expect, it } from "bun:test";

import { removeXLSXHeaderColumns } from "./removeXLSXHeaderRows.ts";

describe("removeXSLXHeaderRows", () => {
  it('should remove rows until `["", "Position"]` row found', () => {
    const result = removeXLSXHeaderColumns([
      ...Array.from({ length: 12 }).map((_, i) => [`${i}`]),
      ["", "Position"],
      ["13"],
    ]);

    expect(result).toEqual([["13"]]);
  });

  it('should remove rows until `["", "ID"]` row found', () => {
    const result = removeXLSXHeaderColumns([
      ...Array.from({ length: 12 }).map((_, i) => [`${i}`]),
      ["", "ID"],
      ["13"],
    ]);

    expect(result).toEqual([["13"]]);
  });

  it("should return an empty array if no data starting column found", () => {
    const result = removeXLSXHeaderColumns(
      Array.from({ length: 11 }).map((_, i) => [`${i}`]),
    );

    expect(result).toEqual([]);
  });
});
