import type { MetadataRoute } from "next";

import { LESSON_PATHS, LESSONS } from "@/content/lessons";
import { SERIES_ARTICLES } from "@/content/series";
import { USE_CASE_PAGES } from "@/content/use-case-pages";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

function absolute(path: string) {
  return new URL(path, SITE_URL).toString();
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/about", "/learn", "/learn/quantum-software-stack", "/series", "/explore", "/assess", "/build", "/map"];
  const seriesRoutes = SERIES_ARTICLES.map((article) => `/series/${article.slug}`);
  const lessonPathRoutes = LESSON_PATHS.map((item) => `/learn/${item.path}`);
  const lessonRoutes = LESSONS.map((lesson) => `/learn/${lesson.path}/${lesson.slug}`);
  const useCaseRoutes = USE_CASE_PAGES.map((useCase) => `/use-cases/${useCase.slug}`);

  return [...staticRoutes, ...seriesRoutes, ...lessonPathRoutes, ...lessonRoutes, ...useCaseRoutes].map((path) => ({
    url: absolute(path),
    lastModified: new Date(),
    changeFrequency: path.includes("/learn/") || path.includes("/use-cases/")
      ? "monthly"
      : "weekly",
    priority: path === "" ? 1 : path.includes("/learn") || path.includes("/use-cases") ? 0.85 : 0.75,
  }));
}
