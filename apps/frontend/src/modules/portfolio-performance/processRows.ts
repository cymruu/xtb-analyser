import { format } from "date-fns";
import { ParsedCashOperationRow } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";

export const processRows = async (rows: ParsedCashOperationRow[]) => {
  const filtered = rows.filter(
    (row) => row.type === "Stock purchase" || row.type === "Stock sale",
  );

  return filtered.map((row) => {
    return [
      format(row.time, "yyyy-MM-dd'T'HH:mm"),
      row.type === "Stock purchase" ? "Buy" : "Sell",
      String(row.amount),
      parseTicker(row.symbol),
      parseTicker(row.symbol),
      String(row.amount),
      "",
      "",
      "",
      "",
      "",
    ];
  });
};
