import { Config, Effect } from "effect";

export const HTTPServerPort = Config.number("PORT").pipe(
  Config.withDefault(3000),
);

export const CorsConfig = Effect.gen(function* () {
  const CORS_ENABLED = yield* Config.boolean("CORS_ENABLED").pipe(
    Config.withDefault(true),
  );
  if (!CORS_ENABLED) {
    return { CORS_ORIGIN: "*" };
  }

  const origin = (yield* Config.url("CORS_ORIGIN")).toString();
  return {
    CORS_ORIGIN:
      origin.substr(-1) === "/" ? origin.substr(0, origin.length - 1) : origin,
  };
});
