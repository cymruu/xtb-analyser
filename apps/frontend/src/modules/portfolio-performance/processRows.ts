import { format } from "date-fns";
import { filter, map } from "effect/Array";
import { Either, Match, pipe } from "effect/index";

import {
  KnownCashOperationTypes,
  ParsedCashOperationRow,
} from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseQuantityV2 } from "../../XTBParser/cashOperationHistory/parseQuantity";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";

const formatPortfolioPerformanceDate = (datetime: Date) => {
  return format(datetime, "yyyy-MM-dd'T'HH:mm");
};

const currency = "PLN";

const processDepositRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Deposit",
    shares: "0",
    ticker_symbol: null,
    security_name: null,
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null, // TODO: handle IKE Deposit
    offset_account: null,
  };
};

const processIKEDepositRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Transfer (Outbound)",
    shares: "0",
    ticker_symbol: null,
    security_name: null,
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: "xtb",
    offset_account: "xtb-ike",
  };
};

const processWithdrawalRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Transfer (Outbound)",
    shares: "0",
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: "xtb",
    offset_account: "wallet", //TODO: parse wallet id
  };
};

const processStockSaleRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Sell",
    shares: parseQuantityV2(row.comment),
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
  };
};

const processStockPurchaseRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Buy",
    shares: parseQuantityV2(row.comment),
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
  };
};

const processDividendRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Dividend",
    shares: "0",
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
  };
};

const processWithholdingTaxRow = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Taxes",
    shares: "0",
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
  };
};

const processFreeFundsInterest = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Interest",
    shares: "0",
    value: String(row.amount),
    currency,
    ticker_symbol: null,
    security_name: null,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
  };
};

const processFreeFundsInterestTax = (
  row: ParsedCashOperationRow,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Taxes",
    shares: "0",
    value: String(row.amount),
    currency,
    ticker_symbol: null,
    security_name: null,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
  };
};

export type PortfolioTransaction = {
  date: string;
  type: string;
  shares: string;
  value: string;
  currency: string | null;
  ticker_symbol: string | null;
  security_name: string | null;
  exchange_rate: string | null;
  fees: string | null;
  taxes: string | null;
  securities_account: string | null;
  cash_account: string | null;
  offset_account: string | null;
};

const mapRow = map((row: ParsedCashOperationRow) =>
  pipe(
    Match.value(row.type),
    Match.when(KnownCashOperationTypes.enum["deposit"], () =>
      processDepositRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["IKE Deposit"], () =>
      processIKEDepositRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["withdrawal"], () =>
      processWithdrawalRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Stock sale"], () =>
      processStockSaleRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Stock purchase"], () =>
      processStockPurchaseRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["DIVIDENT"], () =>
      processDividendRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Withholding Tax"], () =>
      processWithholdingTaxRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Dividend equivalent"], () =>
      processDividendRow(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Free-funds Interest"], () =>
      processFreeFundsInterest(row),
    ),
    Match.when(KnownCashOperationTypes.enum["Free-funds Interest Tax"], () =>
      processFreeFundsInterestTax(row),
    ),

    Match.either,
  ),
);

export const processRows = (rows: ParsedCashOperationRow[]) => {
  return pipe(rows, mapRow, filter(Either.isRight)).map((row) => row.right);
};
