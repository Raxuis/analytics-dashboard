import { passportMetadata } from "@/i18n/metadata";
export { default } from "../../analytics/page";
export const dynamic = "force-dynamic";
const base = passportMetadata("en");
export const metadata = {
  ...base,
  title: "Visits · Raxuis",
  description: "The passport visitor register. Homepage views and outbound clicks over the last seven days.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://passport.raphaelraclot.dev/analytics",
    languages: { fr: "https://passeport.raphaelraclot.dev/analytics", en: "https://passport.raphaelraclot.dev/analytics" },
  },
  openGraph: { ...base.openGraph, title: "Visits · Raxuis", description: "Homepage views and outbound clicks over the last seven days.", url: "https://passport.raphaelraclot.dev/analytics" },
  twitter: { ...base.twitter, title: "Visits · Raxuis", description: "Homepage views and outbound clicks over the last seven days." },
};
