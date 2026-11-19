import type { Metadata } from "next";
import { languageUrls, type Locale } from "./routing";
export function passportMetadata(locale: Locale): Metadata {
  const url = languageUrls[locale];
  const title = locale === "en" ? "Raxuis · Raphaël Raclot’s passport" : "Raxuis · Le passeport de Raphaël Raclot";
  const description = locale === "en" ? "Open Raphaël Raclot’s passport. Explore his portfolio, links and travels." : "Ouvrez le passeport de Raphaël Raclot. Retrouvez son portfolio, ses liens et ses voyages.";
  const image = `${url}/social/passport${locale === "en" ? "-en" : ""}.png`;
  const alt = locale === "en" ? "Raphaël Raclot’s burgundy and gold personal passport." : "Le passeport personnel bordeaux et doré de Raphaël Raclot.";
  return {
    metadataBase: new URL(url), title, description,
    alternates: { canonical: url, languages: { fr: languageUrls.fr, en: languageUrls.en, "x-default": languageUrls.fr } },
    openGraph: { title, description, url, siteName: "Raxuis", type: "website", locale: locale === "en" ? "en_GB" : "fr_FR", alternateLocale: locale === "en" ? "fr_FR" : "en_GB", images: [{ url: image, width: 1200, height: 630, alt }] },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt }] },
  };
}
