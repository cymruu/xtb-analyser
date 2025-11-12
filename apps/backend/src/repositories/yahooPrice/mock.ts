import { Effect, Layer } from "effect";
import { YahooPriceRepository } from "./YahooPriceRepository";
import type { TickerPriceIndex } from "../../services/portfolio";
import type { PricePoint } from "../../services/price";

export const YahooPriceRepositoryMock = Layer.succeed(YahooPriceRepository, {
  getPricesFromDb: function (_priceIndex: TickerPriceIndex) {
    return Effect.succeed([]);
  },
  saveBulkPrices: function (prices: PricePoint[]) {
    return Effect.succeed({ count: prices.length });
  },
});
