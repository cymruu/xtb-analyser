import { format } from "date-fns/format";

import {
  ParsedOpenPositionRow,
  XTB_DATE_FORMAT,
} from "../../parseOpenPositionRows";
import { createXTBTimeString } from "../../../createXTBTestTime";

export const createOpenPositionRow = (
  i: number,
  overwrite: Partial<ParsedOpenPositionRow> = {},
): string[] => {
  return [
    "",
    overwrite.id ? String(overwrite.id) : `${i}`,
    overwrite.symbol ? overwrite.symbol : `position_symbol: ${i}`,
    overwrite.type ? overwrite.type : `BUY`,
    overwrite.volume ? String(overwrite.volume) : `${i + 1}`,
    (overwrite.open_time
      ? format(overwrite.open_time, XTB_DATE_FORMAT)
      : null) || format(createXTBTimeString(i), XTB_DATE_FORMAT),
    overwrite.open_price ? String(overwrite.open_price) : `${i}`,
    overwrite.market_price ? String(overwrite.market_price) : `${i}`,
    overwrite.purchase_value ? String(overwrite.purchase_value) : `${i}`,
    "sl", // ignored for now
    "tp", // ignored for now
    "margin", // ignored for now
    "commission", // ignored for now
    "swap", // ignored for now
    "rollover", // ignored for now
    overwrite.profit ? String(overwrite.profit) : `${i}`,
    "comment", // ignored for now
  ];
};
