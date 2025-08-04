export const removeXLSXHeaderColumns = (rowsWithHeader: string[][]) => {
  return rowsWithHeader.slice(11, undefined);
};
