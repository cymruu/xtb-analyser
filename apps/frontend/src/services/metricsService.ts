import z from "zod";

const noOp = () => {};

type EventName = keyof EventPayloadMap;

type EventPayloadMap = {
  page_load: {
    path: string;
  };
  files_dropped: { count: number };
  render: { name: string; [key: string]: unknown };
  xlsx_parse_issue: ReportableZodParsingIssue[];
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
    collectMetrics: async (name, payload) => {
      return fetch(metricsEndpoint, {
        method: "POST",
        body: JSON.stringify({ name, payload }),
        headers: { "Content-Type": "application/json" },
      }).catch(noOp);
    },
  };
};

const mockMetricsService: IMetricsService = {
  collectMetrics: async (name, payload) => {
    console.log("Mock metrics service called", { name, payload });
  },
};

export const createMetricsService = (backendHost: string | null) => {
  if (!backendHost) {
    return mockMetricsService;
  }

  return createRealMetricsService(backendHost);
};

export const ReportableZodIssueInternalCode = "REPORTABLE_ISSUE";

type ReportableZodParsingIssue = {
  internal_code: string;
  value: unknown;
} & z.core.$ZodIssue;

const isReportableZodParsingIssue = (
  issue: Partial<ReportableZodParsingIssue>,
): issue is ReportableZodParsingIssue => {
  return issue.internal_code === ReportableZodIssueInternalCode;
};

export const getReportableParsingIssues = (
  issues: Partial<ReportableZodParsingIssue>[],
): ReportableZodParsingIssue[] => {
  return issues.filter(isReportableZodParsingIssue);
};
