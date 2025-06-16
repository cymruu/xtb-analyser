import { parseCashOperationRows } from "./parseCashOperationRows";
import { parseDate } from "./parseDate";

export const processCashOperationHistory = (cashOperationSheet: string[][]) => {
  const result = parseCashOperationRows(cashOperationSheet);

  const objects = result.result.map((r) => ({
    ID: r[0],
    Type: r[1],
    Time: parseDate(r[2]),
    Comment: r[3],
    Symbol: r[4],
    Amount: Number(r[5]),
    Total: 0,
  }));

  const deposits = objects
    .filter((r) => r.Type === "deposit")
    .sort((a, b) => a.Time.getTime() - b.Time.getTime())
    .map((x, i, array) => {
      const prev = array[i - 1]?.Total || 0;
      x.Total = prev + x.Amount;
      console.log({ total: x.Total });

      return x;
    });

  return { deposits };
};
