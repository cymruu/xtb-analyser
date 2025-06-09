import z from "zod";

export const AppConfigSchema = z.object({
  PORT: z.coerce.number().positive().gte(1).lte(65535).default(3000),
  DATABASE_URL: z.string().url(),
});
