import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SeriesCompanionExperience } from "@/components/series/SeriesCompanionExperience";
import {
  SERIES_ARTICLES,
  getSeriesArticle,
  getSeriesCompanion,
} from "@/content/series";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SERIES_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getSeriesArticle(slug);
  return {
    title: article ? `${article.title} | Beyond the Quantum Processor` : "Series Companion",
    description: article?.summary,
    alternates: { canonical: `/series/${slug}` },
  };
}

export default async function SeriesArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getSeriesArticle(slug);
  const companion = getSeriesCompanion(slug);
  if (!article || !companion) notFound();

  const nextArticle = companion.nextArticleSlug
    ? getSeriesArticle(companion.nextArticleSlug)
    : null;

  return (
    <SeriesCompanionExperience
      article={article}
      companion={companion}
      nextArticle={nextArticle}
    />
  );
}
