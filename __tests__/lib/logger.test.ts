/**
 * Unit tests for lib/logger.ts
 *
 * We verify that the default logger export is a winston logger instance
 * with expected properties. Log output is silenced in test environment
 * by the silent: true transport option in lib/logger.ts.
 */
import logger from "@/lib/logger";

describe("logger", () => {
  it("is a winston logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("does not throw when logging at various levels", () => {
    expect(() => logger.info("test info message")).not.toThrow();
    expect(() => logger.warn("test warn message")).not.toThrow();
    expect(() => logger.error("test error message")).not.toThrow();
    expect(() => logger.debug("test debug message")).not.toThrow();
  });

  it("accepts metadata objects", () => {
    expect(() =>
      logger.info("message with metadata", { key: "value", count: 42 })
    ).not.toThrow();
  });

  it("accepts Error objects", () => {
    expect(() => logger.error("error with stack", new Error("test error"))).not.toThrow();
  });
});
