/** Public-domain Natural Earth country data. Run manually to refresh prepared assets. */
import fs from "node:fs/promises";
const source =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";
const response = await fetch(source);
if (!response.ok) throw new Error(`Natural Earth: ${response.status}`);
const data = await response.json();
const catalog = {};
await fs.mkdir("public/identity/countries", { recursive: true });
function project(rings, rect = { x: 30, y: 30, width: 940, height: 940 }) {
  // Put the dateline through the largest empty longitude interval, not through the country.
  const lons = [...new Set(rings.flat().map((p) => (p[0] + 360) % 360))].sort(
    (a, b) => a - b,
  );
  let gap = -1,
    start = 0;
  for (let i = 0; i < lons.length; i++) {
    const next =
      lons[(i + 1) % lons.length] + (i === lons.length - 1 ? 360 : 0);
    if (next - lons[i] > gap) {
      gap = next - lons[i];
      start = next % 360;
    }
  }
  const lon = (p) => {
    const n = (p + 360) % 360;
    return n < start - 1e-7 ? n + 360 : n;
  };
  const points = rings.flat();
  const west = Math.min(...points.map((p) => lon(p[0]))),
    east = Math.max(...points.map((p) => lon(p[0]))),
    south = Math.min(...points.map((p) => p[1])),
    north = Math.max(...points.map((p) => p[1]));
  const correction = Math.cos((((south + north) / 2) * Math.PI) / 180);
  const scale = Math.min(
    rect.width / ((east - west) * correction),
    rect.height / (north - south),
  );
  const ox = rect.x + (rect.width - (east - west) * correction * scale) / 2,
    oy = rect.y + (rect.height - (north - south) * scale) / 2;
  const d = rings
    .map(
      (r) =>
        "M" +
        r
          .map(
            (p) =>
              `${(ox + (lon(p[0]) - west) * correction * scale).toFixed(2)},${(oy + (north - p[1]) * scale).toFixed(2)}`,
          )
          .join(" L") +
        " Z",
    )
    .join(" ");

  return {
    d,
    projection: { west, east, south, north, start, correction, scale, ox, oy },
  };
}

for (const feature of data.features) {
  const code = feature.properties.ADM0_A3;
  const polygons =
    feature.geometry.type === "Polygon"
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  const rings = polygons.map((p) => p[0]);
  let groups = [project(rings)];
  let labels = "";
  if (code === "USA") {
    const mainland = rings.filter((r) => r[0][0] > -130 && r[0][1] < 50);
    const alaska = rings.filter((r) => r[0][1] >= 50);
    const hawaii = rings.filter((r) => r[0][0] < -130 && r[0][1] < 30);
    groups = [
      project(mainland, { x: 30, y: 100, width: 940, height: 590 }),
      project(alaska, { x: 35, y: 750, width: 280, height: 210 }),
      project(hawaii, { x: 380, y: 805, width: 210, height: 125 }),
    ];
    labels =
      '<g fill="#315f9b" font-family="sans-serif" font-size="19"><text x="35" y="735">Alaska</text><text x="380" y="790">Hawaï</text></g>';
  }
  const d = groups.map((g) => g.d).join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><pattern id="dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2.3" fill="#315f9b" fill-opacity=".85"/></pattern></defs><path d="${d}" fill="url(#dots)"/>${labels}</svg>\n`;
  await fs.writeFile(`public/identity/countries/${code}.svg`, svg);
  catalog[code] = {
    name: feature.properties.NAME_FR || feature.properties.NAME,
    ...groups[0].projection,
    ...(groups.length > 1 ? { regions: groups.map((g) => g.projection) } : {}),
  };
}
await fs.writeFile(
  "src/components/passport/country-catalog.json",
  JSON.stringify(Object.fromEntries(Object.entries(catalog).sort()), null, 2) +
    "\n",
);
await fs.writeFile(
  "docs/passport-countries.md",
  "# Pays préparés\n\nCode à copier dans `travels` du fichier `src/components/passport/travel-content.ts`. Les silhouettes proviennent du jeu de données Natural Earth 1:110m. Les petits États absents à cette échelle ne sont pas inclus.\n\n| Code | Pays |\n| --- | --- |\n" +
    Object.entries(catalog)
      .sort((a, b) => a[1].name.localeCompare(b[1].name, "fr"))
      .map(([code, country]) => `| ${code} | ${country.name} |`)
      .join("\n") +
    "\n",
);
console.log(`Prepared ${Object.keys(catalog).length} country silhouettes.`);
