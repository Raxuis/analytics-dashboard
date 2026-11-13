import countries from "./country-catalog.json";

export type CountryCode = keyof typeof countries;
export type TravelCity = {
  name: string;
  latitude: number;
  longitude: number;
  /** One short sentence shown on hover, keyboard focus or touch. */
  note?: string;
  /** Personal memory revealed only in UV. */
  uvNote?: string;
};
export type TravelMemory = {
  /** Prepared silhouette identifier. See docs/passport-contributing.md. */
  country: CountryCode;
  visits?: number;
  uvNote?: string;
  places?: readonly string[];
  cities?: readonly TravelCity[];
};

/** Edit here. Each country becomes a page automatically, in this order. */
export const travels: readonly TravelMemory[] = [
  {
    country: "KOR",
    visits: 3,
    cities: [
      {
        name: "Séoul",
        latitude: 37.5665,
        longitude: 126.978,
        note: "Capitale de la Corée du Sud.",
      },
      {
        name: "Busan",
        latitude: 35.1796,
        longitude: 129.0756,
        note: "Ville portuaire sur la côte sud-est.",
      },
      {
        name: "Sokcho",
        latitude: 38.207,
        longitude: 128.5918,
        note: "Sur la côte est, près du massif du Seoraksan.",
      },
      {
        name: "Gyeongju",
        latitude: 35.8562,
        longitude: 129.2247,
        note: "Ancienne capitale du royaume de Silla.",
      },
      {
        name: "Jeonju",
        latitude: 35.8242,
        longitude: 127.148,
        note: "Dans la province du Jeolla du Nord.",
      },
    ],
  },
  {
    country: "JPN",
    visits: 2,
    cities: [
      {
        name: "Tokyo",
        latitude: 35.6762,
        longitude: 139.6503,
        note: "Sur la côte pacifique de Honshū.",
      },
      {
        name: "Kyoto",
        latitude: 35.0116,
        longitude: 135.7681,
        note: "Ancienne capitale impériale du Japon.",
      },
      {
        name: "Osaka",
        latitude: 34.6937,
        longitude: 135.5023,
        note: "Ville du Kansai, au bord de la baie d’Osaka.",
      },
      {
        name: "Nara",
        latitude: 34.6851,
        longitude: 135.8048,
        note: "Ancienne capitale du Japon au VIIIe siècle.",
      },
    ],
  },
  {
    country: "USA",
    places: ["Californie", "Floride", "New York"],
    cities: [
      {
        name: "Miami",
        latitude: 25.7617,
        longitude: -80.1918,
        note: "En Floride, sur la côte atlantique.",
      },
      {
        name: "New York",
        latitude: 40.7128,
        longitude: -74.006,
        note: "À l’embouchure de l’Hudson.",
      },
    ],
  },
  {
    country: "ISL",
    cities: [
      {
        name: "Reykjavík",
        latitude: 64.1466,
        longitude: -21.9426,
        note: "Capitale de l’Islande, sur la côte sud-ouest.",
      },
    ],
  },
];

export const countryName = (code: CountryCode) => countries[code].name;
export const travelPages = travels.map((memory) => ({
  title: countryName(memory.country),
  memory,
}));
export const spreadCount = 1 + Math.ceil(travelPages.length / 2);
