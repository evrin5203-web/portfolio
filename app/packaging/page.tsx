import PackagingPage, { packagingMetadata } from "../collection-page";

export const metadata = packagingMetadata("ru");

export default function Page() {
  return <PackagingPage language="ru" />;
}
