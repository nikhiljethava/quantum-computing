"use client";

import { useEffect } from "react";

import { ProductEvent, trackProductEvent } from "@/lib/analytics";

export function AnalyticsEvent({ event, context }: { event: ProductEvent; context?: string }) {
  useEffect(() => {
    void trackProductEvent(event, context);
  }, [context, event]);

  return null;
}
