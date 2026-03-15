export class AppError extends Error {
  code: string;
  statusCode: number;
  expose: boolean;

  constructor(args: {
    message: string;
    code: string;
    statusCode?: number;
    expose?: boolean;
    cause?: unknown;
  }) {
    super(args.message, { cause: args.cause });
    this.name = "AppError";
    this.code = args.code;
    this.statusCode = args.statusCode ?? 500;
    this.expose = args.expose ?? false;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
