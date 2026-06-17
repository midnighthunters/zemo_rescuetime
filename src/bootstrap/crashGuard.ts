/**
 * Crash Prevention Bootstrap
 *
 * Sets up global error handlers as early as possible to prevent silent crashes.
 * Import this at the very top of the root layout file, before any other imports.
 *
 * Mirrors the crash-prevention pattern from FocusWorld's index.js — adapted for
 * expo-router where we cannot replace the entry point directly.
 *
 * Does NOT use Sentry — errors are surfaced to console only.
 */

// ── Global JS error handler ────────────────────────────────────────────────
// Catches fatal and non-fatal JS errors thrown anywhere in the app tree.
const originalHandler = (global as any).ErrorUtils?.getGlobalHandler?.();
(global as any).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
  console.error('[GlobalErrorHandler] isFatal:', isFatal, error);
  if (originalHandler) originalHandler(error, isFatal);
});

// ── Hermes unhandled promise rejections ────────────────────────────────────
// Hermes doesn't surface unhandled promise rejections to ErrorUtils by default.
// This makes them visible in the console so they aren't silently swallowed.
if ((global as any).HermesInternal) {
  (global as any).HermesInternal.enablePromiseRejectionTracker?.({
    allRejections: true,
    onUnhandled: (id: number, error: unknown) => {
      console.error('[UnhandledPromiseRejection]', id, error);
    },
  });
}

export {};
