import fs from "node:fs";
import { createHash } from "node:crypto";

function hashFile(filePath: string): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    return createHash("sha1").update(buffer).digest("hex");
  } catch {
    return null;
  }
}

export function watchFile(filePath: string, onChange: () => void) {
  let lastHash = hashFile(filePath);

  fs.watchFile(filePath, { interval: 150 }, (curr, prev) => {
    if (curr.mtimeMs === 0) {
      return;
    }

    if (curr.mtimeMs !== prev.mtimeMs || curr.size !== prev.size) {
      const nextHash = hashFile(filePath);
      if (!nextHash || nextHash === lastHash) {
        return;
      }

      lastHash = nextHash;
      onChange();
    }
  });
}
