import { Config } from "effect";

export const HTTPServerPort = Config.number("PORT").pipe(
  Config.withDefault(3000),
);

export const CORS_ORIGIN = Config.url("CORS_ORIGIN");
