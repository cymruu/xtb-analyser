import { describe, it, expect } from "bun:test";

import { parseTicker, TICKER_MAP } from "./parseTicker";

const testCases = [
  { input: { ticker: "UPS.US" }, expected: "UPS" },
  { input: { ticker: "IVG.IT" }, expected: "IVG.IT" },
  { input: { ticker: "JMT.PT" }, expected: "JMT.PT" },
  { input: { ticker: "XTB.PL" }, expected: "XTB.WA" },
  { input: { ticker: "RBOT.UK" }, expected: "RBOT.GB" },
];

describe("parseQuantity", () => {
  for (const testCase of testCases) {
    it(`should properly parse ${testCase.input.ticker} to ${testCase.expected}`, async () => {
      const result = parseTicker(testCase.input.ticker);

      expect(result).toEqual(testCase.expected);
    });
  }

  describe("should return hardcoded value if ticker found in `TICKER_MAP`", () => {
    for (const [ticker, expected] of Object.entries(TICKER_MAP)) {
      it(`should properly parse ${ticker} to ${expected}`, () => {
        const result = parseTicker(ticker);

        expect(result).toEqual(expected!);
      });
    }
  });
});
