import { describe, expect, it } from "bun:test";
import { Effect } from "effect";

import { parseHeader } from "./parseHeader.ts";

const header = [
  [],
  [],
  [],
  [],
  [
    "",
    "",
    "",
    "Name and surname",
    "Account",
    "Currency",
    "",
    "11/08/2025 22:08:40",
  ],
  ["", "", "", "John Doe", "1281399", "PLN"],
  ["", "", "", "Balance", "Equity", "Margin", "Free margin", "Margin level"],
  ["", "", "", "824.11", "312713.74", "0", "824.11", "0.00"],
  [],
  [],
];

describe("parseHeader", () => {
  it("should parse currency", async () => {
    const effect = parseHeader(header);
    expect(await Effect.runPromise(effect)).toEqual({ currency: "PLN" });
  });
});
