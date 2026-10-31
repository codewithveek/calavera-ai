/** An error whose message is safe and meaningful to show to the user. */
export class UserFacingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'UserFacingError';
  }
}

export function toErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof UserFacingError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
