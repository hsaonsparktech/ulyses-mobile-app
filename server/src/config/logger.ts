import { serverEnv } from "./env";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = serverEnv.LOG_LEVEL) {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_SEVERITY[level] >= LEVEL_SEVERITY[this.level];
  }

  private format(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): string {
    const entry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(metadata ? { metadata } : {}),
    };
    return JSON.stringify(entry);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message, metadata));
    }
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, metadata));
    }
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    if (this.shouldLog("error")) {
      console.error(this.format("error", message, metadata));
    }
  }
}

export const logger = new Logger();
