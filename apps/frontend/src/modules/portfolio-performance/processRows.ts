import { format } from "date-fns";
import { filter, map } from "effect/Array";
import { Array, Effect, Match, Option, pipe } from "effect/index";

import {
  KnownCashOperationTypes,
  ParsedCashOperationRow,
} from "../../XTBParser/cashOperationHistory/parseCashOperationRows";
import { parseQuantityV2 } from "../../XTBParser/cashOperationHistory/parseQuantity";
import { parseTicker } from "../../XTBParser/cashOperationHistory/parseTicker";
import {
  KnownClosedPositionTypes,
  ParsedClosedOperation,
} from "../../XTBParser/closedOperationHistory/parseClosedOperationHistoryRows";
import { ParsedOpenPositionRow } from "../../XTBParser/openPositions/parseOpenPositionRows";

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
    type: "Removal",
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
    offset_account: null,
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
  const isRefund = row.amount < 0;

  if (!isRefund) {
    return {
      date: formatPortfolioPerformanceDate(row.time),
      type: "Tax Refund",
      shares: "0",
      ticker_symbol: parseTicker(row.symbol),
      security_name: parseTicker(row.symbol),
      value: String(Math.abs(row.amount)),
      currency: options.currency,
      exchange_rate: null,
      fees: null,
      taxes: null,
      securities_account: null,
      cash_account: null,
      offset_account: null,
      note: row.comment,
    };
  }

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

const processSecFeeRow = (
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

const processTaxIFTTRow = (
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

const processTransferRow = (
  row: ParsedCashOperationRow,
  options: ProcessRowsOptions,
): PortfolioTransaction => {
  return {
    date: formatPortfolioPerformanceDate(row.time),
    type: "Transfer (Outbound)",
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
      // Match.when(KnownCashOperationTypes.enum["Stock sale"], () =>
      //   processStockSaleRow(row, options),
      // ),
      // Match.when(KnownCashOperationTypes.enum["Stock purchase"], () =>
      //   processStockPurchaseRow(row, options),
      // ),
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
      Match.when(KnownCashOperationTypes.enum["Sec Fee"], () =>
        processSecFeeRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["tax IFTT"], () =>
        processTaxIFTTRow(row, options),
      ),
      Match.when(KnownCashOperationTypes.enum["transfer"], () =>
        processTransferRow(row, options),
      ),

      Match.option,
    ),
  );

type ProcessRowsOptions = { currency: string };

export const processRows = (
  rows: ParsedCashOperationRow[],
  options: ProcessRowsOptions,
) => {
  return pipe(rows, mapRow(options), filter(Option.isSome));
};

const mapClosedOperationRowV2 = (options: ProcessRowsOptions) =>
  map((row: ParsedClosedOperation) =>
    pipe(
      Match.value(row.type),
      Match.when(KnownClosedPositionTypes.enum["BUY"], () => {
        console.log({ row });
        const ticker_symbol = parseTicker(row.symbol);

        return [
          {
            date: formatPortfolioPerformanceDate(row.open_time),
            type: "Buy",
            shares: String(row.volume),
            ticker_symbol,
            security_name: ticker_symbol,
            value: String(row.purchase_value),
            currency: options.currency,
            exchange_rate: null,
            fees: null,
            taxes: null,
            securities_account: null,
            cash_account: null,
            offset_account: null,
            note: null,
          },
          {
            date: formatPortfolioPerformanceDate(row.close_time),
            type: "Sell",
            shares: String(row.volume),
            ticker_symbol,
            security_name: ticker_symbol,
            value: String(row.sale_value),
            currency: options.currency,
            exchange_rate: null,
            fees: null,
            taxes: null,
            securities_account: null,
            cash_account: null,
            offset_account: null,
            note: null,
          },
        ] as PortfolioTransaction[];
      }),
      Match.option,
    ),
  );

const mapOpenOperationRowV2 = (options: ProcessRowsOptions) =>
  map((row: ParsedOpenPositionRow) =>
    pipe(
      Match.value(row.type),
      Match.when(KnownClosedPositionTypes.enum["BUY"], () => {
        return [
          {
            date: formatPortfolioPerformanceDate(row.open_time),
            type: "Buy",
            shares: String(row.volume),
            ticker_symbol: parseTicker(row.symbol),
            security_name: parseTicker(row.symbol),
            value: String(row.purchase_value),
            currency: options.currency,
            exchange_rate: null,
            fees: null,
            taxes: null,
            securities_account: null,
            cash_account: null,
            offset_account: null,
            note: null,
          },
        ] as PortfolioTransaction[];
      }),
      Match.option,
    ),
  );

export const processRowsV2 = (
  closedOperationRows: ParsedClosedOperation[],
  openOperationRows: ParsedOpenPositionRow[],
  cashOperationRows: ParsedCashOperationRow[],
  options: ProcessRowsOptions,
) => {
  console.log("processRowsV2", { closedOperationRows, openOperationRows });

  const closedOperationsPipe = pipe(
    closedOperationRows,
    mapClosedOperationRowV2(options),
    filter(Option.isSome),
  );
  const openOperationsPipe = pipe(
    openOperationRows,
    mapOpenOperationRowV2(options),
    filter(Option.isSome),
  );

  const cashOperationPipe = pipe(
    cashOperationRows,
    mapRow(options),
    filter(Option.isSome),
  );

  return [...closedOperationsPipe, ...openOperationsPipe, ...cashOperationPipe];
};

export const processRowsV3 = (
  closedOperationRows: ParsedClosedOperation[],
  openOperationRows: ParsedOpenPositionRow[],
  cashOperationRows: ParsedCashOperationRow[],
  options: ProcessRowsOptions,
) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Processing rows with processRowsV3");

    // TODO: get rid of repeated filters.
    const closed = pipe(
      closedOperationRows,
      //TODO: add support for CFD records
      filter((x) => x.open_price !== 0 && x.sale_value !== 0), // filter out CFD records
      mapClosedOperationRowV2(options),
      filter(Option.isSome),
    );
    const open = pipe(
      openOperationRows,
      mapOpenOperationRowV2(options),
      filter(Option.isSome),
    );
    const cash = pipe(
      cashOperationRows,
      mapRow(options),
      filter(Option.isSome),
    );

    return [...closed, ...open, ...cash];
  });
