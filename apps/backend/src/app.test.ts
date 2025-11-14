import { describe, expect, it } from "bun:test";

import { Effect } from "effect";
import { createApp } from "./app";

describe("app", () => {
  describe("/health", () => {
    it("Should return 200 response", async () => {
      const req = new Request("http://localhost/health");
      const app = await Effect.runPromise(createApp);

      const res = await app.fetch(req);

      expect(res.status).toBe(200);
    });
  });

  describe("/portfolio", () => {
    describe("/xtb-file", () => {
      it("Should return a 400 status when a POST request includes invalid in the body", async () => {
        const formData = new FormData();
        formData.append(
          "file",
          new File([new Blob([Buffer.from("mock")])], "data.xlsx"),
        );

        const req = new Request("http://localhost/portfolio/xtb-file", {
          method: "POST",
          body: formData,
        });
        const app = await Effect.runPromise(createApp);

        const res = await app.fetch(req);

        expect(res.status).toBe(400);
      });

      it("Should return a 400 status when a POST request endpoint is made without including a file in the body", async () => {
        const req = new Request("http://localhost/portfolio/xtb-file", {
          method: "POST",
        });
        const app = await Effect.runPromise(createApp);

        const res = await app.fetch(req);

        expect(res.status).toBe(400);
      });
    });
  });
});
