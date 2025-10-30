export const removeXLSXHeaderColumns = (rows: string[][]) => {
  let startIndex = rows.length;

  for (const [index, row] of rows.entries()) {
    const secondColumn = row?.[1];

    if (secondColumn === "ID" || secondColumn === "Position") {
      startIndex = index + 1;
      break;
    }
  }

  return rows.slice(startIndex);
};
