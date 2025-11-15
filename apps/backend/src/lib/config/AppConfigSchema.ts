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

  const origin = (yield* Config.string("CORS_ORIGIN")).toString();
  yield* Effect.try({
    try: () => {
      new URL(origin);
    },
    catch: () => {
      return Effect.fail("invalid value for CORS_ORIGIN");
    },
  });

  return {
    CORS_ORIGIN: origin,
  };
});
