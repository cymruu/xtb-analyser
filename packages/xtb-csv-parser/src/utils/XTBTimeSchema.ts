import { isValid, parse } from "date-fns";
import z from "zod";

export const XTB_DATE_FORMAT = "d/M/yyyy HH:mm:ss";

export const XTBTimeSchema = z.string().transform((transaction_date, ctx) => {
  const parsed = parse(transaction_date, XTB_DATE_FORMAT, new Date());
  if (!isValid(parsed)) {
    ctx.addIssue({
      code: "custom",
      message: "Invalid date",
      path: ["time"],
    });
    return z.NEVER;
  }

  return parsed;
});
