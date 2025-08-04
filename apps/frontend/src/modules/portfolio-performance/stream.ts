import { format } from "date-fns";

import { ParsedCashOperationRow } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";

const OUTPUT_FILE_HEADER = [
  "Date",
  "Type",
  "Shares",
  "Security Name",
  "Value",
  "Exchange rate",
  "fees",
  "taxes",
  "Securities Account",
  "Cash Account",
];

const createCSVLine = (values: string[]) => {
  return values.join(";") + "\n";
};

export const processRows = async (rows: ParsedCashOperationRow[]) => {
  const filtered = rows.filter(
    (row) => row.type === "Stock purchase" || row.type === "Stock sale",
  );

  const mapped = filtered.map((row) => {
    return {
      Date: row.time,
      Type: row.type === "Stock purchase" ? "Buy" : "Sell",
      Shares: row.amount,
      "Security Name": parseTicker(row.symbol),
      Value: row.amount,
      "Exchange rate": null,
      fees: null,
      taxes: null,
      "Securities Account": null,
      "Cash Account": null,
    };
  });

  // write
  const chunks: string[] = [createCSVLine(OUTPUT_FILE_HEADER)];

  for (const row of mapped) {
    const csvLine = createCSVLine([
      format(row.Date, "yyyy-MM-dd'T'HH:mm"),
      row.Type,
      row.Shares.toString(),
      row["Security Name"],
      Math.abs(row.Value).toString(),
      row["Exchange rate"] || "",
      row.fees || "",
      row.taxes || "",
      row["Securities Account"] || "",
      row["Cash Account"] || "",
    ]);
    chunks.push(csvLine);
  }

  const resultFile = new File(chunks, "test.csv");
  return resultFile;
};
