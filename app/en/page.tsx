import HomeClient from "../home-client";
import { pageMetadata } from "../site-meta";

export const metadata = pageMetadata("en");

export default function Page() {
  return <HomeClient initialLanguage="en" />;
}
