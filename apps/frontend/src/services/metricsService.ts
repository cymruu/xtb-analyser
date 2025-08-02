const noOp = () => {};

type EventName = keyof EventPayloadMap;

type EventPayloadMap = {
  page_load: {
    path: string;
  };
  files_dropped: { count: number };
  render: { name: string; [key: string]: unknown };
};

export interface IMetricsService {
  collectMetrics: <T extends EventName>(
    name: EventName,
    payload: EventPayloadMap[T],
  ) => Promise<Response | void>;
}

const createRealMetricsService = (backendHost: string): IMetricsService => {
  const metricsEndpoint = new URL("metrics", backendHost);
  return {
    collectMetrics: async (name: string, payload: Record<string, any>) => {
      return fetch(metricsEndpoint, {
        method: "POST",
        body: JSON.stringify({ name, payload }),
        headers: { "Content-Type": "application/json" },
      }).catch(noOp);
    },
  };
};

const mockMetricsService: IMetricsService = {
  collectMetrics: async (name: string, payload: Record<string, any>) => {
    console.log("Mock metrics service called", { name, payload });
  },
};

export const createMetricsService = (backendHost: string | null) => {
  if (!backendHost) {
    return mockMetricsService;
  }

  return createRealMetricsService(backendHost);
};
