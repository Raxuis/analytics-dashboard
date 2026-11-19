import english from "./en.json";
import countries from "../components/passport/country-catalog.json";
import isoCountries from "../components/passport/country-iso2.json";
import type { Locale } from "./routing";
export type { Locale } from "./routing";
const names = new Intl.DisplayNames(["en"], { type: "region" });
const countryTranslations = Object.fromEntries(Object.entries(isoCountries).map(([short, long]) => [
  countries[long as keyof typeof countries]?.name, names.of(short) ?? short,
]));
const folded = Object.fromEntries(Object.entries({ ...english, ...countryTranslations }).map(([key, value]) => [key.toLocaleLowerCase("fr"), value]));
export function translate(value: string | undefined, locale: Locale): string {
  if (!value) return "";
  if (locale === "fr") return value;
  const upper = value === value.toLocaleUpperCase("fr") && /[A-ZÀ-Ý]/.test(value);
  const exact = english[value as keyof typeof english] ?? countryTranslations[value] ?? folded[value.toLocaleLowerCase("fr")];
  if (exact) return upper ? exact.toLocaleUpperCase("en") : exact;
  const result = value
    .replace(/(\d+) sur (\d+)/g, "$1 of $2")
    .replace(/(\d+) visites?/gi, (_, count: string) => `${count} visit${count === "1" ? "" : "s"}`)
    .replace(/(\d+) séjours?/gi, (_, count: string) => `${count} stay${count === "1" ? "" : "s"}`)
    .replace(/^Passeport ouvert, double page /, "Passport open, spread ");
  return upper ? result.toLocaleUpperCase("en") : result;
}
