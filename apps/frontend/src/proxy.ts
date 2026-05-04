import { NextRequest, NextResponse } from "next/server";

const LEGACY_HOSTS = new Set([
  "quantum-foundry-frontend-271301686744.us-central1.run.app",
]);

const CANONICAL_HOST = "quantum-foundry-frontend-w24p6g25aq-uc.a.run.app";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();
  if (!host || !LEGACY_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_HOST;
  return NextResponse.redirect(url, 308);
}

