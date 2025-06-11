import { processFile } from "./processFile";

type ProcessFileResult =
  | { error: null; ok: true; treeMapData: unknown }
  | { error: Error; ok: false };

export const processFiles = async (
  files: FileList,
): Promise<ProcessFileResult> => {
  const processed = [];
  for await (const file of files) {
    if (
      file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
      return {
        error: new Error("Invalid file type. Please select an XLSX file."),
        ok: false,
      };

    processed.push({ name: file.name, processed: await processFile(file) });
  }

  const treeMapData = {
    name: "root",
    children: processed.map((f) => {
      return {
        name: f.name,
        children: f.processed,
      };
    }),
  };

  return { error: null, ok: true, treeMapData };
};
