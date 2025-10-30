import { parseCSV } from "@xtb-analyser/xtb-csv-parser";
import { loadExcelize } from "../../utils/loadExcelize";
import { getOpenPositionRowsSummary } from "./analyseOpenPositionRows";
import { Effect } from "effect/index";

export const processFile = async (file: File) => {
  console.info("processing file");

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  return loadExcelize().then(async (excelize) => {
    const result = await Effect.runPromise(parseCSV(bytes, { excelize }));
    const portfolioSummary = getOpenPositionRowsSummary(
      result.openPositions.successes,
    );
    console.log("Portfolio Summary:", portfolioSummary);

    const total = portfolioSummary.reduce(
      (sum, item) => sum + (item.market_value || 0),
      0,
    );

    return portfolioSummary.map((x) => {
      return {
        name: x.symbol,
        value: x.market_value,
        performance: (x.market_price - x.open_price) / x.open_price,
        grossProfit: x.gross_profit,
        weight: x.market_value / total,
      };
    });
  });
};
