import { init } from "excelize-wasm";
// @ts-ignore
import excelizeModule from "../../../node_modules/excelize-wasm/excelize.wasm.gz";
import { findOpenPositionsSheet } from "./XTBParser/openPositions/findOpenPositionsSheet";
import { processOpenPositions } from "./XTBParser/openPositions/processOpenPositions";

const excelizePromise = init(excelizeModule).catch((err) => {
  console.error(err);
  alert("failed to load WASM excelize module");
  throw new Error("Failed to load excelize-wasm module");
});

export const processFile = async (file: File) => {
  console.info("processing file", file.name);

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  return excelizePromise.then(async (excelize) => {
    const xlsxFile = excelize.OpenReader(bytes);

    const sheets = xlsxFile.GetSheetList();
    const operationsSheetIndex = findOpenPositionsSheet(sheets.list);

    const operationsSheet = xlsxFile.GetRows(
      sheets.list[operationsSheetIndex]!,
    );

    const portfolio = processOpenPositions(operationsSheet.result);

    return { portfolio };
  });
};
