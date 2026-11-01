import HomeClient from "../../home-client";
import { projectJsonLd, projectMetadata, projectParams } from "../../project-meta";

export const dynamicParams = false;
export function generateStaticParams() { return projectParams(); }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return projectMetadata(id, "ru");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(id, "ru")) }} />
      <HomeClient initialLanguage="ru" initialProjectId={id} />
    </>
  );
}
