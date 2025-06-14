import { getOpenPositionRowsSummary } from "../../XTBAnalyser/analyseOpenPositionRows";
import { parseOpenPositionRows } from "./parseOpenPositionRows";

export const processOpenPositions = (operationsSheet: string[][]) => {
  const parsedRows = parseOpenPositionRows(operationsSheet);

  const portfolioSummary = getOpenPositionRowsSummary(parsedRows.result);
  console.log("Portfolio Summary:", portfolioSummary);

  const total = portfolioSummary.reduce(
    (sum, item) => sum + (item.market_value || 0),
    0,
  );

  const portfolio = portfolioSummary.map((x) => {
    return {
      name: x.symbol,
      value: x.market_value,
      performance: (x.market_price - x.open_price) / x.open_price,
      grossProfit: x.gross_profit,
      weight: x.market_value / total,
    };
  });

  return portfolio;
};
