const noOp = () => {};

export const metricsService = {
  collectMetrics: async (name: string, payload: Record<string, any>) => {
    return fetch("https://api.dev.xtb-analyser.com/metrics", {
      method: "POST",
      body: JSON.stringify({ name, payload }),
      headers: { "Content-Type": "application/json" },
    }).catch(noOp);
  },
};
