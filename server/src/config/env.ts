import { z } from "zod";

const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_PATH: z.string().default("./data/libros.db"),
    JWT_SECRET: z
      .string()
      .min(16)
      .default("libros_jwt_secret_dev_key_only_min_32_chars"),
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(900), // 15 minutes
    REFRESH_TOKEN_EXPIRES_IN_SECONDS: z.coerce.number().default(604800), // 7 days
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    CORS_ORIGIN: z.string().default("*"),
    RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.NODE_ENV === "production") {
        return (
          data.JWT_SECRET !== "libros_jwt_secret_dev_key_only_min_32_chars" &&
          data.JWT_SECRET.length >= 32
        );
      }
      return true;
    },
    {
      message:
        "Production deployment requires a cryptographically strong, non-default JWT_SECRET with at least 32 characters.",
      path: ["JWT_SECRET"],
    },
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function loadEnv(
  overrides: Partial<Record<string, string>> = {},
): ServerEnv {
  return serverEnvSchema.parse({
    NODE_ENV: overrides.NODE_ENV ?? process.env.NODE_ENV,
    PORT: overrides.PORT ?? process.env.PORT,
    HOST: overrides.HOST ?? process.env.HOST,
    DATABASE_PATH: overrides.DATABASE_PATH ?? process.env.DATABASE_PATH,
    JWT_SECRET: overrides.JWT_SECRET ?? process.env.JWT_SECRET,
    JWT_EXPIRES_IN_SECONDS:
      overrides.JWT_EXPIRES_IN_SECONDS ?? process.env.JWT_EXPIRES_IN_SECONDS,
    REFRESH_TOKEN_EXPIRES_IN_SECONDS:
      overrides.REFRESH_TOKEN_EXPIRES_IN_SECONDS ??
      process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS,
    LOG_LEVEL: overrides.LOG_LEVEL ?? process.env.LOG_LEVEL,
    CORS_ORIGIN: overrides.CORS_ORIGIN ?? process.env.CORS_ORIGIN,
    RATE_LIMIT_ENABLED:
      overrides.RATE_LIMIT_ENABLED ?? process.env.RATE_LIMIT_ENABLED,
  });
}

export const serverEnv = loadEnv();
