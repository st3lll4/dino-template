import fs from 'node:fs';

export function watchFile(filePath: string, onChange: () => void) {
  // The file might not exist yet when the dev server starts
  // so we poll until it appears, then start watching it
  function tryWatch() {
    if (!fs.existsSync(filePath)) {
      setTimeout(tryWatch, 1000)
      return
    }

    fs.watch(filePath, (eventType) => {
      if (eventType === "change") {
        onChange()
      }
    })
  }

  tryWatch()
}