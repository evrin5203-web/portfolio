import type { Metadata } from "next";
import projectData from "./data/projects.json";
import categoryData from "./data/categories.json";
import { siteOrigin } from "./site-meta";

type Localized = { ru: string; en: string };
type ProjectRecord = { id: string; title: Localized; description: Localized; categories: string[]; cover: string; images: { src: string; width: number; height: number; embed?: boolean }[] };
const projects = projectData as ProjectRecord[];
const categories = categoryData as Array<{ id: string; ru: string; en: string }>;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function projectParams() {
  return projects.map((project) => ({ id: project.id }));
}

export function findProject(id: string) {
  return projects.find((project) => project.id === id);
}

function categoryNames(project: ProjectRecord, language: "ru" | "en") {
  return project.categories.map((id) => categories.find((category) => category.id === id)?.[language] ?? id);
}

export function projectMetadata(id: string, language: "ru" | "en"): Metadata {
  const project = findProject(id);
  if (!project) return {};
  const ru = language === "ru";
  const kinds = categoryNames(project, language).join(", ").toLowerCase();
  const title = ru
    ? `${project.title.ru} | Ангелина Болгова — дизайнер`
    : `${project.title.en} | Angelina Bolgova — designer`;
  const description = `${project.description[language]} ${ru ? "Категории" : "Categories"}: ${kinds}.`
  const path = `${basePath}${ru ? "" : "/en"}/projects/${project.id}/`;
  const cover = project.images.find((image) => image.src === project.cover);
  return {
    metadataBase: new URL(siteOrigin),
    title,
    description,
    alternates: {
      canonical: path,
      languages: { ru: `${basePath}/projects/${project.id}/`, en: `${basePath}/en/projects/${project.id}/` },
    },
    openGraph: {
      title,
      description,
      type: "article",
      locale: ru ? "ru_RU" : "en_US",
      url: path,
      images: cover ? [{ url: `${basePath}${project.cover}`, width: cover.width, height: cover.height }] : undefined,
    },
  };
}

export function projectJsonLd(id: string, language: "ru" | "en") {
  const project = findProject(id);
  if (!project) return null;
  const ru = language === "ru";
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title[language],
    description: project.description[language],
    genre: categoryNames(project, language),
    inLanguage: language,
    url: `${siteOrigin}${basePath}${ru ? "" : "/en"}/projects/${project.id}/`,
    image: project.images.filter((image) => !image.embed && !image.src.endsWith(".mp4")).slice(0, 8).map((image) => `${siteOrigin}${basePath}${image.src}`),
    creator: { "@type": "Person", name: ru ? "Ангелина Болгова" : "Angelina Bolgova", url: `${siteOrigin}${basePath}/` },
  };
}

export function personJsonLd(language: "ru" | "en") {
  const ru = language === "ru";
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: ru ? "Ангелина Болгова" : "Angelina Bolgova",
    alternateName: ru ? ["Angelina Bolgova", "Ангелина Болгова дизайнер"] : ["Ангелина Болгова"],
    jobTitle: ru ? "Графический дизайнер и арт-директор" : "Graphic designer and art director",
    description: ru
      ? "Дизайнер и арт-директор: айдентика и брендинг, упаковка, леттеринг, постеры, книги."
      : "Designer and art director: brand identity, packaging, lettering, posters, books.",
    url: `${siteOrigin}${basePath}${ru ? "/" : "/en/"}`,
    image: `${siteOrigin}${basePath}/portfolio/rassol/001.webp`,
    email: "mailto:bolgova.gelya@mail.ru",
    knowsAbout: ru ? ["айдентика", "брендинг", "дизайн упаковки", "леттеринг", "постеры", "дизайн книг"] : ["brand identity", "branding", "packaging design", "lettering", "posters", "book design"],
    sameAs: [
      "https://www.behance.net/angelgelya",
      "https://dprofile.ru/bolgova.gelya",
      "https://t.me/phangelgelya",
      "https://t.me/angelinapsd",
      "https://ru.pinterest.com/phangelgelya/",
      "https://hsedesign.ru/account/angelina-bolgova-c77347417c3141c2b95c519c0576692a",
    ],
  };
}
