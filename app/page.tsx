import HomeClient from "./home-client";
import { pageMetadata } from "./site-meta";
import { personJsonLd } from "./project-meta";

export const metadata = pageMetadata("ru");

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd("ru")) }} />
      <HomeClient initialLanguage="ru" />
    </>
  );
}
