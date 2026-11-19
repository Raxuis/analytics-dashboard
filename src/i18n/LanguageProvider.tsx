"use client";
import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import { translate, type Locale } from "./language";
const LanguageContext = createContext<Locale>("fr");
export function LanguageProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}
export function useLanguage() {
  const locale = useContext(LanguageContext);
  return useMemo(() => ({ locale, t: (value?: string) => translate(value, locale) }), [locale]);
}
