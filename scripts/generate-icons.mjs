import fs from "node:fs/promises";
import sharp from "sharp";

// The SVG masks the original logo, retaining its exact silhouette.
const source = await fs.readFile("public/icon.svg");
const smallSource = await fs.readFile("public/identity/favicon-small.svg");
const sizes = [16, 32, 48];
const pngs = await Promise.all(
  sizes.map((size) =>
    sharp(size === 16 ? smallSource : source)
      .resize(size, size)
      .png()
      .toBuffer(),
  ),
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let i = 0; i < sizes.length; i++) {
  const position = 6 + i * 16;
  header[position] = sizes[i];
  header[position + 1] = sizes[i];
  header.writeUInt16LE(1, position + 4);
  header.writeUInt16LE(32, position + 6);
  header.writeUInt32LE(pngs[i].length, position + 8);
  header.writeUInt32LE(offset, position + 12);
  offset += pngs[i].length;
}
await fs.writeFile("public/favicon.ico", Buffer.concat([header, ...pngs]));
await sharp(source)
  .resize(180, 180)
  .png()
  .toFile("public/apple-touch-icon.png");
await sharp(source)
  .resize(512, 512)
  .png()
  .toFile("public/identity/passport-icon.png");
console.log(
  "Generated favicon 16, 32, 48 px, touch icon 180 px, preview 512 px.",
);
