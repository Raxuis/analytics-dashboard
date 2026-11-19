export type Locale = "fr" | "en";
export function languageFromRequest(host: string, path: string): Locale {
  return host.split(":")[0]?.toLowerCase() === "passport.raphaelraclot.dev" || path === "/en" || path.startsWith("/en/") ? "en" : "fr";
}
export const languageUrls = {
  fr: "https://passeport.raphaelraclot.dev",
  en: "https://passport.raphaelraclot.dev",
};
