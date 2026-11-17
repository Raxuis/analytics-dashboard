import isoCountries from "./country-iso2.json";
import flagCodes from "./flag-codes.json";

const available = new Set<string>(flagCodes);
const alpha2 = Object.fromEntries(
  Object.entries(isoCountries).map(([short, long]) => [long, short]),
);

/** Accept both passport alpha-3 codes and the registry's alpha-2 codes. */
export function countryFlag(code: string): string | undefined {
  const normalized = code.toUpperCase();
  const short = alpha2[normalized] ?? normalized;
  return available.has(short)
    ? `/identity/flags/${short.toLowerCase()}.svg`
    : undefined;
}
