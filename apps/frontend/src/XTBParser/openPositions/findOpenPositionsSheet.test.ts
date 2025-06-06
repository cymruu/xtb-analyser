import { describe, expect, it } from "bun:test";

import { findOpenPositionsSheet } from "./findOpenPositionsSheet";

const testCases = [
  {
    description:
      "should return the correct index when 'OPEN POSITION' is present in the middle",
    input: [
      "CLOSED POSITION HISTORY",
      "OPEN POSITION 28032025",
      "PENDING ORDERS HISTORY ",
      "CASH OPERATION HISTORY",
      "CLOSED POSITION HISTORY MT",
      "BALANCE OPERATION HISTORY MT",
    ],
    expected: 1,
  },
  {
    description: "should return 0 when 'OPEN POSITION' is the first element",
    input: [
      "OPEN POSITION 28032025",
      "PENDING ORDERS HISTORY ",
      "CASH OPERATION HISTORY",
      "CLOSED POSITION HISTORY MT",
      "BALANCE OPERATION HISTORY MT",
    ],
    expected: 0,
  },
  {
    description: "should return -1 when the input array is empty",
    input: [],
    expected: -1,
  },
  {
    description:
      "should return -1 when 'OPEN POSITION' is not found in the array",
    input: [
      "CLOSED POSITION HISTORY",
      "PENDING ORDERS HISTORY ",
      "CASH OPERATION HISTORY",
    ],
    expected: -1,
  },
];

describe("findSheetIndex", () => {
  for (const testCase of testCases) {
    it(testCase.description, () => {
      const result = findOpenPositionsSheet(testCase.input);

      expect(result).toEqual(testCase.expected);
    });
  }
});
