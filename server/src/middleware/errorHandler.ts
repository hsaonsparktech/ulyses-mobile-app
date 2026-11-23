import type { ServerResponse } from "node:http";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { createProblemDetails, HttpError } from "../utils/problemDetails";

export function handleRequestError(
  error: unknown,
  instance: string,
  res: ServerResponse,
): void {
  res.setHeader("Content-Type", "application/problem+json");

  if (error instanceof HttpError) {
    res.statusCode = error.status;
    res.end(JSON.stringify(error.toProblemDetails(instance), null, 2));
    return;
  }

  if (error instanceof ZodError) {
    const invalidParams = error.issues.map((issue) => ({
      name: issue.path.join(".") || "body",
      reason: issue.message,
    }));

    const problem = createProblemDetails(
      400,
      "Validation Error",
      "One or more request parameters failed validation.",
      instance,
      "https://api.libros.io/errors/validation-error",
      invalidParams,
    );

    res.statusCode = 400;
    res.end(JSON.stringify(problem, null, 2));
    return;
  }

  // Catch-all for unhandled exceptions
  const message =
    error instanceof Error ? error.message : "Internal Server Error";
  logger.error("Unhandled server exception", {
    error: String(error),
    instance,
  });

  const problem = createProblemDetails(
    500,
    "Internal Server Error",
    process.env.NODE_ENV === "production"
      ? "An unexpected server error occurred."
      : message,
    instance,
  );

  res.statusCode = 500;
  res.end(JSON.stringify(problem, null, 2));
}
