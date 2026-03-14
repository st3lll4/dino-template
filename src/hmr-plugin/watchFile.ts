import fs from "node:fs";

export function watchFile(filePath: string, onChange: () => void) {
  // The file might not exist yet when the dev server starts
  // so we poll until it appears, then start watching it
  let lastSignature = "";
  let debounceTimer: NodeJS.Timeout | null = null;

  function getSignature(): string {
    try {
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, "utf-8");
      return `${stat.size}:${content}`;
    } catch {
      return "";
    }
  }

  function emitIfChanged() {
    const nextSignature = getSignature();
    if (!nextSignature || nextSignature === lastSignature) {
      return;
    }
    lastSignature = nextSignature;
    onChange();
  }

  function tryWatch() {
    if (!fs.existsSync(filePath)) {
      setTimeout(tryWatch, 1000);
      return;
    }

    lastSignature = getSignature();

    fs.watch(filePath, (eventType) => {
      if (eventType === "change") {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          emitIfChanged();
        }, 50);
      }
    });
  }

  tryWatch();
}
