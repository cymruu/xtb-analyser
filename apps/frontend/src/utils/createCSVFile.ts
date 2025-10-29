const createCSVLine = (values: string[]) => {
  return values.join(";") + "\n";
};

export const createCSVFile = ({
  fileName,
  header,
  csvLines,
}: {
  fileName: string;
  header: string[];
  csvLines: string[][];
}) => {
  const chunks: string[] = [createCSVLine(header)];

  for (const line of csvLines) {
    const csvLine = createCSVLine(line);
    chunks.push(csvLine);
  }

  const resultFile = new File(chunks, fileName);
  return resultFile;
};
