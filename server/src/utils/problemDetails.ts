export interface InvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  invalidParams?: InvalidParam[];
  [key: string]: unknown;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly title: string,
    public readonly detail: string,
    public readonly type = `https://api.libros.io/errors/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    public readonly invalidParams?: InvalidParam[],
  ) {
    super(detail);
    this.name = "HttpError";
  }

  toProblemDetails(instance: string): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance,
      ...(this.invalidParams ? { invalidParams: this.invalidParams } : {}),
    };
  }
}

export function createProblemDetails(
  status: number,
  title: string,
  detail: string,
  instance: string,
  type = `https://api.libros.io/errors/${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  invalidParams?: InvalidParam[],
): ProblemDetails {
  return {
    type,
    title,
    status,
    detail,
    instance,
    ...(invalidParams ? { invalidParams } : {}),
  };
}
