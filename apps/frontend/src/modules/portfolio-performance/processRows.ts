import { format } from "date-fns";
import { filter, map } from "effect/Array";
import { Effect, Match, Option, pipe } from "effect/index";

import {
  KnownCashOperationTypes,
  ParsedCashOperationRow,
} from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseQuantityV2 } from "../../XTBParser/cashOperationHistory/parseQuantity";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";

const formatPortfolioPerformanceDate = (datetime: Date) => {
  return format(datetime, "yyyy-MM-dd'T'HH:mm");
};

const processDepositRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Deposit",
    shares: "0",
    ticker_symbol: null,
    security_name: null,
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null, // TODO: handle IKE Deposit
    offset_account: null,
    note: row.comment,
  };
};

const processIKEDepositRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Transfer (Outbound)",
    shares: "0",
    ticker_symbol: null,
    security_name: null,
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: "xtb",
    offset_account: "xtb-ike",
    note: row.comment,
  };
};

const processWithdrawalRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Transfer (Outbound)",
    shares: "0",
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: "xtb",
    offset_account: "wallet", //TODO: parse wallet id
    note: row.comment,
  };
};

const processStockSaleRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Sell",
    shares: parseQuantityV2(row.comment),
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
    note: row.comment,
  };
};

const processStockPurchaseRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Buy",
    shares: parseQuantityV2(row.comment),
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
    note: row.comment,
  };
};

const processDividendRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Dividend",
    shares: "0",
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
    note: row.comment,
  };
};

const processWithholdingTaxRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Taxes",
    shares: "0",
    ticker_symbol: parseTicker(row.symbol),
    security_name: parseTicker(row.symbol),
    value: String(row.amount),
    currency: options.currency,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
    note: row.comment,
  };
};

const processFreeFundsInterest = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Interest",
    shares: "0",
    value: String(row.amount),
    currency: options.currency,
    ticker_symbol: null,
    security_name: null,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
    note: row.comment,
  };
};

const processFreeFundsInterestTax = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Taxes",
    shares: "0",
    value: String(row.amount),
    currency: options.currency,
    ticker_symbol: null,
    security_name: null,
    exchange_rate: null,
    fees: null,
    taxes: null,
    securities_account: null,
    cash_account: null,
    offset_account: null,
    note: row.comment,
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
  note: string | null;
};

const mapRow = (options: ProcessRowsOptions) =>
  map((row: ParsedCashOperationRow) =>
    pipe(
      Match.value(row.type),
      Match.when(KnownCashOperationTypes.enum["deposit"], () =>
        processDepositRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["IKE Deposit"], () =>
        processIKEDepositRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["withdrawal"], () =>
        processWithdrawalRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["Stock sale"], () =>
        processStockSaleRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["Stock purchase"], () =>
        processStockPurchaseRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["DIVIDENT"], () =>
        processDividendRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["Withholding Tax"], () =>
        processWithholdingTaxRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["Dividend equivalent"], () =>
        processDividendRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["Free-funds Interest"], () =>
        processFreeFundsInterest(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["Free-funds Interest Tax"], () =>
        processFreeFundsInterestTax(row, options),
      ),

      Match.option,
    ),
  );

type ProcessRowsOptions = { currency: string };

export const processRows = (
  rows: ParsedCashOperationRow[],
  options: ProcessRowsOptions,
) => {
  return pipe(rows, mapRow(options), filter(Option.isSome)).map(
    (row) => row.value,
  );
};
