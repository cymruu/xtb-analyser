import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, unique, int, varchar, datetime, json, double, text } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const portfolio = mysqlTable("Portfolio", {
  id: int().autoincrement().notNull(),
  uuid: varchar({ length: 191 }).notNull(),
  createdAt: datetime({ mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
  updatedAt: datetime({ mode: 'string', fsp: 3 }).notNull(),
  schemaVersion: varchar({ length: 191 }).notNull(),
  schema: json().notNull(),
},
  (table) => [
    primaryKey({ columns: [table.id], name: "Portfolio_id" }),
    unique("Portfolio_uuid_key").on(table.uuid),
  ]);

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

export const prismaMigrations = mysqlTable("_prisma_migrations", {
  id: varchar({ length: 36 }).notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: datetime("finished_at", { mode: 'string', fsp: 3 }),
  migrationName: varchar("migration_name", { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: datetime("rolled_back_at", { mode: 'string', fsp: 3 }),
  startedAt: datetime("started_at", { mode: 'string', fsp: 3 }).default(sql`(CURRENT_TIMESTAMP(3))`).notNull(),
  appliedStepsCount: int("applied_steps_count", { unsigned: true }).default(0).notNull(),
},
  (table) => [
    primaryKey({ columns: [table.id], name: "_prisma_migrations_id" }),
  ]);
