import { Effect, Layer } from "effect";
import { YahooPriceRepository } from "./YahooPriceRepository";
import type { TickerPriceIndex } from "../../services/portfolio";
import type { YahooPrice } from "../../services/price";
import type { MySqlRawQueryResult } from "drizzle-orm/mysql2";

export const YahooPriceRepositoryMock = Layer.succeed(YahooPriceRepository, {
  getPricesFromDb: function(_priceIndex: TickerPriceIndex) {
    return Effect.succeed([]);
  },
  saveBulkPrices: function(prices: YahooPrice[]) {
    return Effect.succeed([{ affectedRows: prices.length }, []] as unknown as MySqlRawQueryResult);
  },
});
