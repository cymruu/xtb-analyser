export const findSheetIndex = (match: RegExp) => (sheets: string[]) => {
  return sheets.findIndex((sheetName) => match.test(sheetName));
};
