import { describe, expect, it } from "bun:test";

import { ConfigProvider, Effect } from "effect";
import { createApp } from "./app";

describe("/health", () => {
  it("Should return 200 response", async () => {
    const req = new Request("http://localhost/health");

    const app = await Effect.runPromise(
      Effect.withConfigProvider(
        createApp,
        ConfigProvider.fromMap(new Map([["APP_URL", "https://localhost"]])),
      ),
    );

    const res = await app.fetch(req);

    expect(res.status).toBe(200);
  });
});
