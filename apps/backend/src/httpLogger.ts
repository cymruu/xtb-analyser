import { Effect } from "effect";
import type { Context } from "hono";

import type { HonoEnv } from "./types";

export const WithHTTPLogger = <A, E, R>(
  c: Context<HonoEnv>,
  effect: Effect.Effect<A, E, R>,
) => {
  const { method, path } = c.req;
  const requestId = c.get("requestId");

  return effect.pipe(
    Effect.withSpan(`${method} ${path}`),
    Effect.annotateLogs({ method, path, requestId }),
  );
};
