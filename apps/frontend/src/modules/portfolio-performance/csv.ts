import { PortfolioTransaction } from "./processRows";

export const PORTFOLIO_PERFORMANCE_PORTFOLIO_TRANSACTIONS_FILE_HEADER = [
  "Date",
  "Type",
  "Shares",
  "Ticker Symbol",
  "Security Name",
  "Value",
  "Exchange rate",
  "fees",
  "taxes",
  "Securities Account",
  "Cash Account",
  "Offset Account",
  "Transaction Currency",
  "Note",
];

export const portfolioTransactionToCSVRow = (
  portfolioTransaction: PortfolioTransaction,
): string[] => {
  return [
    portfolioTransaction.date || "",
    portfolioTransaction.type || "",
    portfolioTransaction.shares || "",
    portfolioTransaction.ticker_symbol || "",
    portfolioTransaction.security_name || "",
    portfolioTransaction.value || "",
    portfolioTransaction.exchange_rate || "",
    portfolioTransaction.fees || "",
    portfolioTransaction.taxes || "",
    portfolioTransaction.securities_account || "",
    portfolioTransaction.cash_account || "",
    portfolioTransaction.offset_account || "",
    portfolioTransaction.currency || "",
    portfolioTransaction.note || "",
  ];
};
