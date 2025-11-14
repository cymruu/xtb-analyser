import { Config } from "effect";

export const HTTPServerPort = Config.number("PORT").pipe(
  Config.withDefault(3000),
);

export const AppURL = Config.url("APP_URL").pipe(
  Config.withDefault(new URL("http://localhost")),
);
