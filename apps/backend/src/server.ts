import app from "./app";

const server = Bun.serve({
  fetch: app.fetch,
});

process.on("SIGINT", async () => {
  await server.stop();
  process.exit();
});
