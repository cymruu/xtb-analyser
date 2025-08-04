const OUTPUT_FILE_HEADER = [
  "Date",
  "Type",
  "Shares",
  "Ticker Symbol",
  "Security Name",
  "Value",
  "Exchange rate",
  "fees",
  "taxes",
  "Securities Account",
  "Cash Account",
];

// TODO: this is already pretty generic. move it outside this module
const createCSVLine = (values: string[]) => {
  return values.join(";") + "\n";
};

export const generateCSV = (csvLines: string[][]) => {
  const chunks: string[] = [createCSVLine(OUTPUT_FILE_HEADER)];

  for (const line of csvLines) {
    const csvLine = createCSVLine(line);
    chunks.push(csvLine);
  }

  const resultFile = new File(chunks, "test.csv");
  return resultFile;
};
