import { format } from "date-fns";
import {
  KnownCashOperationTypes,
  ParsedCashOperationRow,
} from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";
import { parseQuantityV2 } from "../../XTBParser/cashOperationHistory/parseQuantity";
import { Match, pipe, Either } from "effect/index";
import { filter, map } from "effect/Array";

const processDepositRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: format(row.time, "yyyy-MM-dd'T'HH:mm"),
    type: "Deposit",
    shares: "0",
    ticker_symbol: null,
    security_name: null,
    value: String(row.amount),
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null, // TODO: handle IKE Deposit
  };
};

const processStockSaleRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: format(row.time, "yyyy-MM-dd'T'HH:mm"),
    type: "Sell",
    shares: parseQuantityV2(row.comment),
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
  };
};

const processStockPurchaseRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: format(row.time, "yyyy-MM-dd'T'HH:mm"),
    type: "Buy",
    shares: parseQuantityV2(row.comment),
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
  };
};

export type PortfolioTransaction = {
  date: string;
  type: string;
  shares: string;
  value: string;
  ticker_symbol: string | null;
  security_name: string | null;
  exchange_rate: string | null;
  fees: string | null;
  taxes: string | null;
  securities_account: string | null;
  cash_account: string | null;
};

const mapRow = map((row: ParsedCashOperationRow) =>
  pipe(
    Match.value(row.type),
    Match.when(KnownCashOperationTypes.enum["deposit"], () =>
      processDepositRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["IKE Deposit"], () =>
      processDepositRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Stock sale"], () =>
      processStockSaleRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Stock purchase"], () =>
      processStockPurchaseRow(row),
    ),
    Match.either,
  ),
);

export const processRows = (rows: ParsedCashOperationRow[]) => {
  return pipe(rows, mapRow, filter(Either.isRight)).map((row) => row.right);
};
