"use client";
import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { languageUrls } from "./routing";
export function LanguageSwitch() {
  const { locale } = useLanguage();
  const path = usePathname().replace(/^\/en(?=\/|$)/, "") || "/";
  const other = locale === "fr" ? "en" : "fr";
  return <a className="language-switch" href={`${languageUrls[other]}${path === "/" ? "" : path}`} hrefLang={other} lang={other}
    aria-label={other === "en" ? "Read in English" : "Lire en français"}
    title={other === "en" ? "Read in English" : "Lire en français"}>{other.toUpperCase()}</a>;
}
