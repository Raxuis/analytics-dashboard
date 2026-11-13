import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
  metadataBase: new URL("https://raxuis.vercel.app"),
  title: "Raxuis · Raphaël Raclot",
  description:
    "Raphaël Raclot, développeur web. Mon portfolio, mon code et quelques façons de se retrouver.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Raxuis · Raphaël Raclot",
    description: "Un passeport vers mes projets et mon univers.",
    locale: "fr_FR",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${sans.variable} ${display.variable} ${ocr.variable}`}>
        {children}
      </body>
    </html>
  );
}
