import { format } from "date-fns";
import { createXTBTimeString } from "../../../createXTBTestTime";
import { XTB_DATE_FORMAT } from "../../../utils/XTBTimeSchema";

export const createCashOperationRow = (i: number): string[] => {
  return [
    "",
    `transaction_id: ${i}`,
    `transaction_type: ${i}`,
    `transaction_time: ${i}`,
    `transaction_comment: ${i}`,
    `transaction_symbol: ${i}`,
    `transaction_amount: ${i}`,
  ];
};

export const createCashOperationRowV2 = (i: number): string[] => {
  return [
    "",
    `${i}`,
    `deposit`,
    format(createXTBTimeString(i), XTB_DATE_FORMAT),
    `transaction_comment: ${i}`,
    `transaction_symbol: ${i}`,
    `${i}`,
  ];
};
