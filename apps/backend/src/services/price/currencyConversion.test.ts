import { describe, expect, it } from "bun:test";

import { convertCurrency } from "./currencyConversion";

describe("convertCurrency", () => {
  it("should convert currency at provided rate", () => {
    const result = convertCurrency({ currency: "PLN", value: 100 }, 0.2746);

    expect(result).toEqual(27.46);
  });
});
