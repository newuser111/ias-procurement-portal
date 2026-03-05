"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-ias-charcoal">Something went wrong</h2>
        <p className="text-ias-gray-500 mt-2 text-sm">An unexpected error occurred.</p>
        <button
          onClick={reset}
          className="mt-4 px-5 py-2 bg-ias-charcoal text-white rounded-lg text-sm font-medium hover:bg-ias-charcoal-light"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
