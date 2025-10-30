import { format } from "date-fns/format";

import { createXTBTimeString } from "../../../createXTBTestTime";
import { XTB_DATE_FORMAT } from "../../../utils/XTBTimeSchema";

export const createClosedPositionRow = (
  i: number,
  overwrite: Partial<{
    id: string;
    symbol: string;
    type: string;
    volume: string;
    open_time: number;
    open_price: string;
    close_time: number;
    close_price: string;
    purchase_value: string;
    sale_value: string;
  }> = {},
): string[] => {
  const openTimeNumber = overwrite.open_time ?? i;
  const closeTimeNumber = overwrite.close_time ?? i;

  return [
    "",
    overwrite.id ? String(overwrite.id) : `${i}`,
    overwrite.symbol ? overwrite.symbol : `position_symbol: ${i}`,
    overwrite.type ? overwrite.type : `BUY`,
    overwrite.volume ? String(overwrite.volume) : `${i + 1}`,
    format(createXTBTimeString(openTimeNumber), XTB_DATE_FORMAT),
    overwrite.open_price ? String(overwrite.open_price) : `${i}`,
    format(createXTBTimeString(closeTimeNumber), XTB_DATE_FORMAT),
    overwrite.close_price ?? `${i}`,
    "_open_origin", //ignored for now
    "_close_origin", //ignored for now
    overwrite.purchase_value ?? `${i}`,
    overwrite.sale_value ?? `${i}`,
  ];
};
