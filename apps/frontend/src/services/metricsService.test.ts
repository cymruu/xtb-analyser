import { describe, expect, it } from "bun:test";
import {
  getReportableParsingIssues,
  ReportableZodIssueInternalCode,
} from "./metricsService.ts";

describe("metricsService", () => {
  describe("getReportableParsingIssues", () => {
    it("should return an empty array when no issues have the reportable internal code", () => {
      const result = getReportableParsingIssues([{ code: "invalid_type" }]);

      expect(result).toEqual([]);
    });

    it("should return an array containing only the issues that have the reportable internal code", () => {
      const result = getReportableParsingIssues([
        {
          internal_code: ReportableZodIssueInternalCode,
          code: "custom",
          value: "1",
          path: [],
          message: "",
        },
        { code: "invalid_type" }, // A non-matching issue
      ]);

      expect(result).toEqual([
        {
          internal_code: ReportableZodIssueInternalCode,
          code: "custom",
          value: "1",
          path: [],
          message: "",
        },
      ]);
    });

    it("should correctly handle an array with multiple reportable and non-reportable issues", () => {
      const result = getReportableParsingIssues([
        { code: "unrecognized_keys" }, // Non-reportable
        {
          internal_code: ReportableZodIssueInternalCode,
          code: "custom",
          value: "a",
          path: ["key1"],
          message: "Issue 1",
        },
        { code: "invalid_format" }, // Non-reportable
        {
          internal_code: ReportableZodIssueInternalCode,
          code: "custom",
          value: "b",
          path: ["key2"],
          message: "Issue 2",
        },
      ]);

      expect(result).toEqual([
        {
          internal_code: ReportableZodIssueInternalCode,
          code: "custom",
          value: "a",
          path: ["key1"],
          message: "Issue 1",
        },
        {
          internal_code: ReportableZodIssueInternalCode,
          code: "custom",
          value: "b",
          path: ["key2"],
          message: "Issue 2",
        },
      ]);
    });
  });
});
