import type { Metadata } from "next";
import { headers } from "next/headers";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import localFont from "next/font/local";
import "./globals.css";
import { site } from "@/lib/site";

const sans = localFont({
  src: "../public/fonts/dm-sans.ttf",
  variable: "--font-sans",
  display: "swap",
});
const display = localFont({
  src: "../public/fonts/space-grotesk.ttf",
  variable: "--font-display",
  display: "swap",
});
const ocr = localFont({
  src: "../public/fonts/ocr-b.ttf",
  variable: "--font-ocr",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: site.title,
    description: site.description,
    url: site.url,
    siteName: "Raxuis",
    images: [{ url: site.image, width: 1200, height: 630, alt: site.imageAlt }],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    images: [{ url: site.image, alt: site.imageAlt }],
  },
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = (await headers()).get("x-passport-locale") === "en" ? "en" : "fr";
  return (
    <html lang={locale}>
      <body className={`${sans.variable} ${display.variable} ${ocr.variable}`}>
        <LanguageProvider locale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
