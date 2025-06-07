import { createApp } from "./app";
import { AppConfigSchema } from "./lib/config/AppConfigSchema";
import { createServices } from "./services";

(async () => {
  const configParseResult = AppConfigSchema.safeParse(process.env);
  if (!configParseResult.success) {
    throw configParseResult.error;
  }

  const services = await createServices();
  const app = createApp(services);

  const server = Bun.serve({
    fetch: app.fetch,
    port: configParseResult.data.PORT,
  });

  console.log(`Server listening on port ${configParseResult.data.PORT}`);

  process.on("SIGINT", async () => {
    console.info("received SIGINT... shutting down");
    await server.stop();
    process.exit();
  });
})();
