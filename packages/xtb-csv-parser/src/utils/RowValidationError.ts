import { Data } from "effect";
import type z from "zod";

export class RowValidationError extends Data.TaggedError("RowValidationError")<{
  parseError: z.ZodError;
}> {}
