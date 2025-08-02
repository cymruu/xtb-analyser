import { init } from "excelize-wasm";
import excelizeModulePath from "../../../../node_modules/excelize-wasm/excelize.wasm.gz";

// TODO: find more elegant way to handle it
const excelizeModuleName = excelizeModulePath.replace("../", "./");

export const loadExcelize = () => {
  const excelizePromise = init("/js/" + excelizeModuleName).catch((err) => {
    console.error(err);
    alert("failed to load WASM excelize module");
    throw new Error("Failed to load excelize-wasm module");
  });

  return excelizePromise;
};
