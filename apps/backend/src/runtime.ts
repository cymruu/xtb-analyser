import { Layer, ManagedRuntime } from "effect";

import { TimeServiceLive } from "./services/time/time";
import { YahooPriceRepositoryLive } from "./repositories/yahooPrice/YahooPriceRepository";
import { YahooFinanceLive } from "./services/yahooFinance";

export const MainLayerLive = Layer.mergeAll(
  TimeServiceLive,
  YahooPriceRepositoryLive.pipe(Layer.provide(TimeServiceLive)),
  YahooFinanceLive,
);

export const MainRuntimeLive = ManagedRuntime.make(MainLayerLive);
