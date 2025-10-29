import { init } from "excelize-wasm";
import excelizeModulePath from "excelize-wasm/excelize.wasm.gz";
import { Effect } from "effect/index";

// TODO: find more elegant way to handle it
const excelizeModuleName = excelizeModulePath.replace("../", "./");

console.log({ excelizeModulePath, excelizeModuleName });

export const loadExcelize = () => {
  const excelizePromise = init("/js/" + excelizeModuleName).catch((err) => {
    console.error(err);
    alert("failed to load WASM excelize module");
    throw new Error("Failed to load excelize-wasm module");
  });

  return excelizePromise;
};

export const loadExcelizeEffect = Effect.tryPromise({
  try: () => init("/js/" + excelizeModuleName),
  catch: (err) => {
    Effect.logError(err);
    return new Error("Failed to load excelize-wasm module");
  },
});
