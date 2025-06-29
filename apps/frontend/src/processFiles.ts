import { processFile } from "./processFile";
import { TreemapLeaf } from "./renderer";

type ProcessFileResult =
  | { error: null; ok: true; treeMapData: TreemapLeaf }
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

  const treeMapData: TreemapLeaf = {
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
