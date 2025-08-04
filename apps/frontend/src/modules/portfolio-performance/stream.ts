import { ParsedCashOperationRow } from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseCostPerShare } from "../../XTBParser/cashOperationHistory/parseCostPerShare";
import { parseDate } from "../../XTBParser/cashOperationHistory/parseDate";
import { parseQuantity } from "../../XTBParser/cashOperationHistory/parseQuantity";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";

// TODO: a lot of code is duplicated from xtb-to-divtracker module.
// Restructure it
const textEncoder = new TextEncoder();

const OUTPUT_FILE_HEADER = [
  "Ticker",
  "Quantity",
  "Cost Per Share",
  "Currency",
  "Date",
  "Commission",
  "Commission Currency",
  "DRIP Confirmed",
];

const createCSVLine = (values: string[]) => {
  return values.join(";") + "\n";
};

export const processRows = async (rows: ParsedCashOperationRow[]) => {
  const timeStamp = new Date().toISOString();
  const fileName = `wallet_${timeStamp}.csv`;
  console.log(rows);

  const resultFile = new File([JSON.stringify(rows)], fileName);

  return resultFile;
};

// const chunks: string[] = [];
//
// const outputStream = new WritableStream({
//   write(chunk) {
//     chunks.push(chunk);
//   },
// });
//
// const writer = outputStream.getWriter();
// const headerBytes = textEncoder.encode(createCSVLine(OUTPUT_FILE_HEADER));
//
// await writer.write(headerBytes);
// writer.releaseLock();
