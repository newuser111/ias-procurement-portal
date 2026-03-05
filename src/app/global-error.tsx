"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>An unexpected error occurred.</p>
          <button
            onClick={reset}
            style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", background: "#323232", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
