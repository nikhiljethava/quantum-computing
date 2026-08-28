import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/learn", "/series", "/explore", "/assess", "/build", "/map", "/use-cases"],
        disallow: ["/projects", "/sessions", "/saved", "/jobs"],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
