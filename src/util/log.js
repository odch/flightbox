import * as Sentry from "@sentry/react";

export function error(message, e) {
  if (console && typeof console.error === 'function') {
    console.error(message, e);
  }

  if (e instanceof Error) {
    Sentry.captureException(e, {
      extra: {message},
    });
  } else {
    // For non-Error values (e.g., strings), log as a message
    Sentry.captureMessage(message + ': ' + String(e));
  }
}
