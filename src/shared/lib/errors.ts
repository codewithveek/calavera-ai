/** An error whose message is safe and meaningful to show to the user. */
export class UserFacingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'UserFacingError';
  }
}

/**
 * Only messages written for people are shown. Anything else (database,
 * download or native errors) is technical, so the friendly fallback is used.
 */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return error instanceof UserFacingError ? error.message : fallback;
}
