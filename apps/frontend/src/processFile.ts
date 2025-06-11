import { init } from "excelize-wasm";
// @ts-ignore
import excelizeModule from "../../../node_modules/excelize-wasm/excelize.wasm.gz";
import { getOpenPositionRowsSummary } from "./XTBAnalyser/analyseOpenPositionRows";
import { findOpenPositionsSheet } from "./XTBParser/openPositions/findOpenPositionsSheet";
import { parseOpenPositionRows } from "./XTBParser/openPositions/parseOpenPositionRows";
import { drawTreemap } from "./charts/drawTreemap";

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

      const total = portfolioSummary.reduce(
        (sum, item) => sum + (item.market_value || 0),
        0,
      );

      const treeMapData = {
        name: "root",
        children: [
          {
            name: "Portfolio Summary",
            children: portfolioSummary.map((x) => {
              return {
                name: x.symbol,
                value: x.market_value,
                performance: (x.market_price - x.open_price) / x.open_price,
                grossProfit: x.gross_profit,
                weight: x.market_value / total,
              };
            }),
          },
        ],
      };

      const svg = drawTreemap(treeMapData, settings); // Append the SVG element.
      container!.firstChild?.remove();
      container!.append(svg.node()!);
    })
    .catch((err) => {
      console.error(err);
      alert("failed to load WASM excelize module");
    });
};
