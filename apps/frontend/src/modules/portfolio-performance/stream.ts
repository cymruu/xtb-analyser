import { format } from "date-fns";
import { ParsedCashOperationRow } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseCostPerShare } from "../../XTBParser/cashOperationHistory/parseCostPerShare";
import { parseDate } from "../../XTBParser/cashOperationHistory/parseDate";
import { parseQuantity } from "../../XTBParser/cashOperationHistory/parseQuantity";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";

// TODO: a lot of code is duplicated from xtb-to-divtracker module.
// Restructure it
const textEncoder = new TextEncoder();

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

  console.log({ filtered });

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

  console.log({ mapped });

  // write
  const chunks: string[] = [createCSVLine(OUTPUT_FILE_HEADER)];

  for (const row of mapped) {
    const csvLine = createCSVLine([
      format(row.Date, "yyyy-MM-dd"),
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
