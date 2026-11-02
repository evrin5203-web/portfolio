import type { MetadataRoute } from "next";
import projectData from "./data/projects.json";
import { siteOrigin } from "./site-meta";

export const dynamic = "force-static";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base = `${siteOrigin}${basePath}`;
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1, alternates: { languages: { ru: `${base}/`, en: `${base}/en/` } } },
    { url: `${base}/en/`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/packaging/`, lastModified: now, changeFrequency: "monthly", priority: 0.9, alternates: { languages: { ru: `${base}/packaging/`, en: `${base}/en/packaging/` } } },
    { url: `${base}/en/packaging/`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  for (const project of projectData as Array<{ id: string }>) {
    pages.push({ url: `${base}/projects/${project.id}/`, lastModified: now, changeFrequency: "yearly", priority: 0.7, alternates: { languages: { ru: `${base}/projects/${project.id}/`, en: `${base}/en/projects/${project.id}/` } } });
    pages.push({ url: `${base}/en/projects/${project.id}/`, lastModified: now, changeFrequency: "yearly", priority: 0.5 });
  }
  return pages;
}
