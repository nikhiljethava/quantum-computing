import { NextRequest, NextResponse } from "next/server";

const LEGACY_HOSTS = new Set(
  (process.env.NEXT_PUBLIC_LEGACY_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
);

const CANONICAL_HOST = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim().toLowerCase() ?? "";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase();
  if (!CANONICAL_HOST || !host || !LEGACY_HOSTS.has(host)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = CANONICAL_HOST;
  return NextResponse.redirect(url, 308);
}
