import type { Metadata } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ogImage = `${basePath}/portfolio/rassol/001.webp`;

export const siteOrigin = "https://evrin5203-web.github.io";

export function pageMetadata(language: "ru" | "en"): Metadata {
  const ru = language === "ru";
  const title = ru
    ? "Ангелина Болгова — графический дизайнер и арт-директор, портфолио"
    : "Angelina Bolgova — graphic designer & art director, portfolio";
  const description = ru
    ? "Ангелина Болгова — портфолио дизайнера: айдентика и брендинг, дизайн упаковки, леттеринг, постеры, книги. Заказать дизайн — Telegram @phangelgelya."
    : "Portfolio of Angelina Bolgova: brand identity, packaging, lettering, posters and books. Commissions — Telegram @phangelgelya.";
  return {
    metadataBase: new URL(siteOrigin),
    title,
    description,
    alternates: {
      canonical: ru ? `${basePath}/` : `${basePath}/en/`,
      languages: { ru: `${basePath}/`, en: `${basePath}/en/` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: ru ? "ru_RU" : "en_US",
      url: ru ? `${basePath}/` : `${basePath}/en/`,
      images: [{ url: ogImage, width: 900, height: 1270 }],
    },
  };
}
