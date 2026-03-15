import fs from "node:fs";

export function watchFile(filePath: string, onChange: () => void) {
  fs.watchFile(filePath, { interval: 150 }, (curr, prev) => {
    if (curr.mtimeMs === 0) {
      return;
    }

    if (curr.mtimeMs !== prev.mtimeMs || curr.size !== prev.size) {
      onChange();
    }
  });
}
