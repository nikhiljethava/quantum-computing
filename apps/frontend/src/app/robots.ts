import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://quantum-foundry-frontend-271301686744.us-central1.run.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/learn", "/explore", "/assess", "/build", "/map", "/use-cases"],
        disallow: ["/projects", "/sessions", "/saved", "/jobs"],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
