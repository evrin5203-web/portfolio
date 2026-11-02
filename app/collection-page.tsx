import type { Metadata } from "next";
import projectData from "./data/projects.json";
import { siteOrigin } from "./site-meta";
import CustomCursor from "./custom-cursor";

type Language = "ru" | "en";
type Img = { src: string; width: number; height: number };
type Project = { id: string; title: Record<Language, string>; description: Record<Language, string>; images: Img[] };

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TELEGRAM = "phangelgelya";
const projects = projectData as unknown as Project[];

// Подборка «Упаковка»: проекты и кадры (номера картинок в галерее проекта, с 1).
const packaging: Array<{ id: string; pick: number[]; tag: Record<Language, string> }> = [
  { id: "onda-ice-cream-packaging", pick: [16, 5, 12, 18, 23, 32, 10], tag: { ru: "мороженое · линейка вкусов", en: "ice cream · flavour range" } },
  { id: "khvost-norm", pick: [9, 12, 15, 16], tag: { ru: "корм для кошек и собак", en: "cat & dog food" } },
  { id: "etlon-eto-znak", pick: [6, 7, 5, 10], tag: { ru: "стаканы и капхолдеры для кофейни", en: "coffee cups & sleeves" } },
  { id: "office-glow", pick: [9, 7, 11, 12], tag: { ru: "подарочный набор для офиса", en: "office gift box" } },
];

const copy = {
  ru: {
    title: "Дизайн упаковки — избранные проекты | Ангелина Болгова",
    description: "Избранные проекты Ангелины Болговой по дизайну упаковки: мороженое ONDA, корм «Хвост НОРМ», стаканы Etlon Coffee, Office Glow. Заказать дизайн упаковки — Telegram @phangelgelya.",
    kicker: "ИЗБРАННОЕ / УПАКОВКА",
    heading: "Упаковка",
    lead: "Упаковка, которую хочется взять с полки: характерная графика, система для целой линейки и продуманные детали — от этикетки до витрины.",
    open: "Смотреть проект целиком",
    ctaKicker: "ВАШ ПРОДУКТ / СЛЕДУЮЩИЙ",
    ctaTitle: "Нужна упаковка для вашего бренда?",
    ctaButton: "Заказать упаковку",
    ctaText: "Привет, Ангелина! Хочу обсудить дизайн упаковки. Посмотрел(а) подборку «Упаковка» в портфолио.",
    hire: "заказать",
    back: "← всё портфолио",
    name: "Ангелина Болгова",
  },
  en: {
    title: "Packaging design — selected projects | Angelina Bolgova",
    description: "Selected packaging design by Angelina Bolgova: ONDA ice cream, Khvost NORM pet food, Etlon Coffee cups, Office Glow. Commissions — Telegram @phangelgelya.",
    kicker: "SELECTED / PACKAGING",
    heading: "Packaging",
    lead: "Packaging you want to pick up from the shelf: distinctive graphics, a system for the whole range and considered details — from the label to the shop display.",
    open: "See the full project",
    ctaKicker: "YOUR PRODUCT / NEXT",
    ctaTitle: "Need packaging for your brand?",
    ctaButton: "Order packaging design",
    ctaText: "Hi Angelina! I'd like to discuss packaging design. I saw the Packaging selection in your portfolio.",
    hire: "hire me",
    back: "← full portfolio",
    name: "Angelina Bolgova",
  },
} as const;

const pagePath = (language: Language) => `${basePath}${language === "en" ? "/en" : ""}/packaging/`;

export function packagingMetadata(language: Language): Metadata {
  const t = copy[language];
  const cover = projects.find((p) => p.id === packaging[0].id)!.images[packaging[0].pick[0] - 1].src;
  return {
    metadataBase: new URL(siteOrigin),
    title: t.title,
    description: t.description,
    alternates: { canonical: pagePath(language), languages: { ru: pagePath("ru"), en: pagePath("en") } },
    openGraph: { title: t.title, description: t.description, type: "website", locale: language === "en" ? "en_US" : "ru_RU", url: pagePath(language), images: [{ url: `${basePath}${cover}` }] },
  };
}

export default function PackagingPage({ language }: { language: Language }) {
  const t = copy[language];
  const home = `${basePath}${language === "en" ? "/en/" : "/"}`;
  const items = packaging.map((entry) => ({ ...entry, project: projects.find((p) => p.id === entry.id)! })).filter((item) => item.project);
  const order = `https://t.me/${TELEGRAM}?text=${encodeURIComponent(t.ctaText)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.title,
    description: t.description,
    url: `${siteOrigin}${pagePath(language)}`,
    author: { "@type": "Person", name: t.name },
    hasPart: items.map(({ project }) => ({ "@type": "CreativeWork", name: project.title[language], url: `${siteOrigin}${basePath}${language === "en" ? "/en" : ""}/projects/${project.id}/` })),
  };

  return (
    <div className={`collection-page lang-${language}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CustomCursor />
      <header className="collection-bar">
        <a className="collection-name" href={home}>{t.name}</a>
        <nav>
          <a href={home}>{t.back}</a>
          <a className="hire-link" href={order} target="_blank" rel="noreferrer">{t.hire}</a>
          <span className="language-switch">
            <a className={language === "ru" ? "is-active" : ""} href={pagePath("ru")} hrefLang="ru">RU</a>
            <a className={language === "en" ? "is-active" : ""} href={pagePath("en")} hrefLang="en">EN</a>
          </span>
        </nav>
      </header>

      <main>
        <section className="collection-hero">
          <p className="collection-kicker">{t.kicker} · {items.length}</p>
          <h1>{t.heading}</h1>
          <p className="collection-lead">{t.lead}</p>
          <ol className="collection-toc">
            {items.map(({ project }, index) => (
              <li key={project.id}><a href={`#${project.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{project.title[language]}</a></li>
            ))}
          </ol>
        </section>

        {items.map(({ project, pick, tag }, index) => {
          const images = pick.map((n) => project.images[n - 1]).filter(Boolean);
          const hero = images[0] && images[0].width > images[0].height ? images[0] : undefined;
          const rest = hero ? images.slice(1) : images;
          const projectUrl = `${basePath}${language === "en" ? "/en" : ""}/projects/${project.id}/`;
          return (
            <article className="collection-item" id={project.id} key={project.id}>
              <div className="collection-text">
                <p className="collection-kicker">{String(index + 1).padStart(2, "0")} / {tag[language]}</p>
                <h2><a href={projectUrl}>{project.title[language]}</a></h2>
                <p>{project.description[language]}</p>
                <a className="collection-open" href={projectUrl}>{t.open} →</a>
              </div>
              <div className="collection-gallery">
                {hero && (
                  <a className="collection-hero-img" href={projectUrl}>
                    <img src={`${basePath}${hero.src}`} width={hero.width} height={hero.height} alt={project.title[language]} loading={index === 0 ? "eager" : "lazy"} />
                  </a>
                )}
                <div className="collection-grid">
                  {rest.map((image, i) => (
                    <a href={projectUrl} key={image.src}>
                      <img src={`${basePath}${image.src}`} width={image.width} height={image.height} alt={`${project.title[language]} — ${i + (hero ? 2 : 1)}`} loading={index === 0 && !hero && i < 2 ? "eager" : "lazy"} />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          );
        })}

        <aside className="project-cta collection-cta">
          <p>{t.ctaKicker}</p>
          <h3>{t.ctaTitle}</h3>
          <a className="cta-button" href={order} target="_blank" rel="noreferrer">{t.ctaButton} <span aria-hidden="true">→</span></a>
          <small>Telegram @{TELEGRAM}</small>
        </aside>
      </main>
    </div>
  );
}
