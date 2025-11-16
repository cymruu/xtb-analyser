import type { Runtime } from "effect";

import type { YahooPriceRepository } from "./repositories/yahooPrice/YahooPriceRepository";
import type { TimeService } from "./services/time/time";
import type { YahooFinance } from "./services/yahooFinance";

export type HonoEnv = {
  Variables: {
    runtime: Runtime.Runtime<TimeService | YahooPriceRepository | YahooFinance>;
  };
};

export type TypedEntries<T> = { [K in keyof T]: [K, T[K]] }[keyof T][];

export type BrandedType<T, K extends string> = T & {
  __brand: K;
};
