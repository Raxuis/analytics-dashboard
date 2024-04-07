import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerUrl } from "./get-server-url";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Raphaël | Analytics",
  description:
    "An Analytics Dashboard Website made by Raphaël | Raxuis to check his stats!",
  keywords: "Raphaël, Raxuis, Analytics, Next.js, React.js",
  icons: {
    icon: '/favicon.ico',
  },
  metadataBase: new URL(getServerUrl())
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark bg-[#020817]`}>{children}</body>
    </html>
  );
}
