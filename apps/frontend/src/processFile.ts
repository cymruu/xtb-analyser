import { init } from "excelize-wasm";
// @ts-ignore
import excelizeModule from "../../../node_modules/excelize-wasm/excelize.wasm.gz";
import { getOpenPositionRowsSummary } from "./XTBAnalyser/analyseOpenPositionRows";
import { findOpenPositionsSheet } from "./XTBParser/openPositions/findOpenPositionsSheet";
import { parseOpenPositionRows } from "./XTBParser/openPositions/parseOpenPositionRows";
import { portfolioSummaryTreemap } from "./charts/portfolioSummary";

const excelizePromise = init(excelizeModule);

export type ProcessFileSettings = { hideValue: boolean };

export const processFile = async (
  file: File,
  settings: ProcessFileSettings,
) => {
  console.info("processing file", settings);

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  excelizePromise
    .then(async (excelize) => {
      const xlsxFile = excelize.OpenReader(bytes);

      const sheets = xlsxFile.GetSheetList();
      const operationsSheetIndex = findOpenPositionsSheet(sheets.list);

      const result = xlsxFile.GetRows(sheets.list[operationsSheetIndex]!);
      const parsedRows = parseOpenPositionRows(result.result);

      const portfolioSummary = getOpenPositionRowsSummary(parsedRows.result);
      console.log("Portfolio Summary:", portfolioSummary);
      const container = document.getElementById("container");
      const svg = portfolioSummaryTreemap(
        {
          symbol: "portfolio",
          market_value: 0,
          children: portfolioSummary,
          percentage_gross_profit: 0,
          market_price: 0,
          open_price: 0,
        },
        settings,
      );
      // Append the SVG element.
      container!.firstChild?.remove();
      container!.append(svg.node()!);
    })
    .catch((err) => {
      console.error(err);
      alert("failed to load WASM excelize module");
    });
};
