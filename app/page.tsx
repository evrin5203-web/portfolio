import HomeClient from "./home-client";
import { pageMetadata } from "./site-meta";

export const metadata = pageMetadata("ru");

export default function Page() {
  return <HomeClient initialLanguage="ru" />;
}
