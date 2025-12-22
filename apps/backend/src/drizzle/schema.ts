import { sql } from "drizzle-orm";
import { datetime, double, int, mysqlTable, primaryKey, unique, varchar } from "drizzle-orm/mysql-core";


export const yahooPrice = mysqlTable("YahooPrice", {
  id: int().autoincrement().notNull(),
  symbol: varchar({ length: 191 }).notNull(),
  currency: varchar({ length: 191 }).notNull(),
  datetime: datetime({ mode: 'date', fsp: 3 }).notNull(),
  open: double().notNull(),
  high: double().notNull(),
  low: double().notNull(),
  close: double().notNull(),
  close_adj: double().notNull(),
  createdAt: datetime({ mode: 'date', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
  updatedAt: datetime({ mode: 'date', fsp: 3 }).notNull(),
},
  (table) => [
    primaryKey({ columns: [table.id], name: "YahooPrice_id" }),
    unique("YahooPrice_symbol_datetime_key").on(table.symbol, table.datetime),
  ]);


