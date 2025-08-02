import { init } from "excelize-wasm";
import excelizeModulePath from "../../../../../node_modules/excelize-wasm/excelize.wasm.gz";
import { getOpenPositionRowsSummary } from "./analyseOpenPositionRows";
import { findOpenPositionsSheet } from "../../XTBParser/openPositions/findOpenPositionsSheet";
import { parseOpenPositionRows } from "../../XTBParser/openPositions/parseOpenPositionRows";

const excelizeModuleName = excelizeModulePath.replace("../", "./");

const excelizePromise = init("/js/" + excelizeModuleName).catch((err) => {
  console.error(err);
  alert("failed to load WASM excelize module");
  throw new Error("Failed to load excelize-wasm module");
});

export const processFile = async (file: File) => {
  console.info("processing file");

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  return excelizePromise.then(async (excelize) => {
    const xlsxFile = excelize.OpenReader(bytes);

    const sheets = xlsxFile.GetSheetList();
    const operationsSheetIndex = findOpenPositionsSheet(sheets.list);

    const result = xlsxFile.GetRows(sheets.list[operationsSheetIndex]!);
    const parsedRows = parseOpenPositionRows(result.result);

    const portfolioSummary = getOpenPositionRowsSummary(parsedRows.result);
    console.log("Portfolio Summary:", portfolioSummary);

    const total = portfolioSummary.reduce(
      (sum, item) => sum + (item.market_value || 0),
      0,
    );

    return portfolioSummary.map((x) => {
      return {
        name: x.symbol,
        value: x.market_value,
        performance: (x.market_price - x.open_price) / x.open_price,
        grossProfit: x.gross_profit,
        weight: x.market_value / total,
      };
    });
  });
};
