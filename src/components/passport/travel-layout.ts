import catalog from "./country-catalog.json";
import {
  type CountryCode,
  type TravelCity,
  type TravelMemory,
  countryName,
} from "./travel-content";

export const TRAVEL_MAP = { x: 72, y: 190, width: 880, height: 880 };
export type CityMarker = {
  city: TravelCity;
  country: string;
  x: number;
  y: number;
};
export function projectCity(
  country: CountryCode,
  city: TravelCity,
): CityMarker {
  const base = catalog[country];
  const regions = "regions" in base ? base.regions : [base];
  const c =
    regions.find((region) => {
      let lon = (city.longitude + 360) % 360;
      if (lon < region.start - 1e-7) lon += 360;
      return (
        lon >= region.west &&
        lon <= region.east &&
        city.latitude >= region.south &&
        city.latitude <= region.north
      );
    }) ?? base;
  let longitude = (city.longitude + 360) % 360;
  if (longitude < c.start - 1e-7) longitude += 360;
  const x = (c.ox + (longitude - c.west) * c.correction * c.scale) / 1000;
  const y = (c.oy + (c.north - city.latitude) * c.scale) / 1000;
  return {
    city,
    country: countryName(country),
    x: TRAVEL_MAP.x + x * TRAVEL_MAP.width,
    y: TRAVEL_MAP.y + y * TRAVEL_MAP.height,
  };
}
export function cityMarkers(memory?: TravelMemory): CityMarker[] {
  return memory?.cities?.map((city) => projectCity(memory.country, city)) ?? [];
}
export function cityAtUV(
  memory: TravelMemory | undefined,
  u: number,
  v: number,
): CityMarker | null {
  const x = u * 1024,
    y = (1 - v) * 1440;
  const closest = cityMarkers(memory)
    .map((marker) => ({ marker, d: Math.hypot(marker.x - x, marker.y - y) }))
    .sort((a, b) => a.d - b.d)[0];
  return closest && closest.d <= 25 ? closest.marker : null;
}
