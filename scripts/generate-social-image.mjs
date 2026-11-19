/** Native composition from the French passport vector emblem and self-hosted font. No invented content. */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const fontfile = path.resolve("public/fonts/dm-sans.ttf");
const gold = "#d8b36b";
const english = process.argv.includes("--locale=en");
async function label(text, size, color, left, top, center = false) {
  const { data, info } = await sharp({
    text: {
      text: `<span foreground="${color}">${text}</span>`,
      font: `DM Sans ${size}`,
      fontfile,
      rgba: true,
      dpi: 72,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return {
    input: data,
    left: Math.round(left - (center ? info.width / 2 : 0)),
    top,
  };
}
const coverBase = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="316" height="450"><rect x="3" y="2" width="310" height="445" rx="13" fill="#3d0827" stroke="#71405a" stroke-width="2"/><path d="M19 10V438" stroke="#200b19" stroke-width="5" opacity=".55"/><rect x="9" y="8" width="297" height="432" rx="9" fill="none" stroke="#854c66" stroke-opacity=".2"/></svg>',
);
const crestMask = await sharp("public/identity/passport-crest.svg")
  .resize(186, 198)
  .ensureAlpha()
  .extractChannel("alpha")
  .raw()
  .toBuffer();
const crest = await sharp({
  create: { width: 186, height: 198, channels: 3, background: gold },
})
  .joinChannel(crestMask, { raw: { width: 186, height: 198, channels: 1 } })
  .png()
  .toBuffer();
const underline = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="130" height="2"><path d="M0 1H130" stroke="${gold}" stroke-width="1"/></svg>`);
const chip = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="23"><g stroke="${gold}" fill="none" stroke-width="1.4"><rect x="1" y="1" width="34" height="21" rx="1"/><circle cx="18" cy="11.5" r="6"/><path d="M1 11.5h11m12 0h11"/></g></svg>`,
);
const flatCover = await sharp(coverBase)
  .composite([
    await label("Raphaël Raclot", 19, gold, 158, 43, true),
    await label("Raxuis", 16, gold, 158, 72, true),
    { input: crest, left: 65, top: 128 },
    await label(english ? "PASSPORT" : "PASSEPORT", 20, gold, 158, 365, true),
    { input: underline, left: 93, top: 391 },
    { input: chip, left: 140, top: 402 },
  ])
  .png()
  .toBuffer();
const cover = await sharp(flatCover)
  .rotate(-7, { background: "#00000000" })
  .png()
  .toBuffer();
await fs.mkdir("public/social", { recursive: true });
await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#141416" },
})
  .composite([
    { input: cover, left: 164, top: 66 },
    await label("Raphaël", 54, "#f3f3f4", 620, 175),
    await label("Raclot", 54, "#f3f3f4", 620, 243),
    await label(english ? "Portfolio · Links · Travels" : "Portfolio · Liens · Voyages", 22, "#b5b5bd", 620, 349),
    await label(english ? "passport.raphaelraclot.dev" : "passeport.raphaelraclot.dev", 18, "#d8b36b", 620, 453),
  ])
  .png()
  .toFile(`public/social/passport${english ? "-en" : ""}.png`);
console.log("Created self-hosted social preview, 1200 × 630.");
