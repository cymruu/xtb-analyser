import { format } from "date-fns";

import { createXTBTimeString } from "../../../createXTBTestTime";
import { XTB_DATE_FORMAT } from "../../../utils/XTBTimeSchema";

export const createCashOperationRowV2 = (
  i: number,
  override: Partial<{
    id: string;
    type: string;
    time: number;
    comment: string;
    symbol: string;
    amount: string;
  }> = {},
): string[] => {
  const timeNumber = override.time ?? i;
  return [
    "",
    override.id ?? `${i}`,
    override.type ?? `deposit`,
    format(createXTBTimeString(timeNumber), XTB_DATE_FORMAT),
    override.comment ?? `transaction_comment: ${i}`,
    override.symbol ?? `transaction_symbol: ${i}`,
    override.amount ?? `${i}`,
  ];
};
