import { ParsedOpenPositionRow } from "../XTBParser/openPositions/parseOpenPositionRows";

type OpenPositionSummaryRow = {
  volume: number;
  market_value: number;
  open_price: number;
  market_price: number;
  gross_profit: number;
};

const calculateOpenPositionSummaryRow = (
  rows: ParsedOpenPositionRow[],
): OpenPositionSummaryRow => {
  return rows.reduce(
    (acc, row) => {
      return {
        volume: acc.volume + row.volume,
        market_value: acc.market_value + row.purchase_value,
        open_price: (acc.open_price + row.open_price) / 2, // Average open price
        market_price: acc.market_price + row.market_price,
        gross_profit: acc.gross_profit + row.profit,
      };
    },
    {
      volume: 0,
      market_value: 0,
      open_price: 0,
      market_price: 0,
      gross_profit: 0,
    },
  );
};

export const getOpenPositionRowsSummary = (rows: ParsedOpenPositionRow[]) => {
  const grouped = Object.groupBy(rows, (v) => v.symbol);
  return Object.entries(grouped).map(([symbol, row]) => ({
    symbol,
    ...calculateOpenPositionSummaryRow(row!),
  }));
};
