import { describe, expect, it } from "bun:test";

import { createTestApp } from "../test/utils/createTestApp";

const app = await createTestApp();

describe("/health", () => {
  it("Should return 200 response", async () => {
    const req = new Request("http://localhost/health");
    const res = await app.fetch(req);

    expect(res.status).toBe(200);
  });
});
