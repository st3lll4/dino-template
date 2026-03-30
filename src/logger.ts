export function createLogger(prefix: string) {
  const tag = `[${prefix}]`;
  return {
    debug: (...args: unknown[]) => console.debug(tag, ...args),
    info: (...args: unknown[]) => console.info(tag, ...args),
    error: (...args: unknown[]) => console.error(tag, ...args),
  };
}
