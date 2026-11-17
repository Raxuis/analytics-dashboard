/* eslint-disable @next/next/no-img-element -- Small local SVGs need no image optimisation. */
import React from "react";
import { countryFlag } from "./country-flags";

/** Decorative next to the country name, so assistive technology reads it once. */
export function CountryFlag({ code }: { code: string }) {
  const src = countryFlag(code);
  return src ? (
    <img
      className="country-flag"
      src={src}
      width={24}
      height={18}
      alt=""
      aria-hidden="true"
    />
  ) : null;
}
