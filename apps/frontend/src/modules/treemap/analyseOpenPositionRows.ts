import { ParsedOpenPositionRow } from "@xtb-analyser/xtb-csv-parser";

type OpenPositionSummaryRow = {
  volume: number;
  market_value: number;
  total_open_price: number;
  market_price: number;
  gross_profit: number;
};

const calculateOpenPositionSummaryRow = (
  rows: ParsedOpenPositionRow[],
): OpenPositionSummaryRow => {
  const result = rows.reduce(
    (acc, row) => {
      return {
        volume: acc.volume + row.volume,
        market_value: acc.market_value + row.market_price * row.volume,
        total_open_price: acc.total_open_price + row.open_price,
        market_price: row.market_price,
        gross_profit: acc.gross_profit + row.profit,
      };
    },
    {
      volume: 0,
      market_value: 0,
      total_open_price: 0,
      market_price: 0,
      gross_profit: 0,
    },
  );
  return result;
};

export const getOpenPositionRowsSummary = (rows: ParsedOpenPositionRow[]) => {
  const grouped = Object.groupBy(rows, (v) => v.symbol);
  return Object.entries(grouped).map(([symbol, rows = []]) => {
    const summaryRow = calculateOpenPositionSummaryRow(rows!);

    return {
      symbol,
      ...summaryRow,
      open_price: summaryRow.total_open_price / rows.length,
    };
  });
};
