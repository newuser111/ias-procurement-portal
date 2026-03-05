"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key && typeof window !== "undefined") {
      posthog.init(key, {
        api_host: host || "https://us.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        persistence: "localStorage+cookie",
        loaded: () => setInitialized(true),
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>;

  return (
    <PHProvider client={posthog}>
      <PostHogIdentifier />
      {children}
    </PHProvider>
  );
}

function PostHogIdentifier() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.email) {
      posthog.identify(session.user.email, {
        name: session.user.name || undefined,
        email: session.user.email,
      });
    }
  }, [session]);

  return null;
}
