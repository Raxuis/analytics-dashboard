import fs from "node:fs/promises";
const mark = (await fs.readFile("public/identity/raxuis-logo.png")).toString(
  "base64",
);
// The cover uses a clean vector adaptation of the French passport emblem.
// Attribution and CC BY-SA 4.0 terms are recorded beside the source asset.
const crest = (await fs.readFile("public/identity/sources/french-emblem.svg", "utf8"))
  .replace('width="600" height="856" viewBox="0 0 600 856"',
    'width="512" height="545" viewBox="150 251 298 317"');
await fs.writeFile("public/identity/passport-crest.svg", crest);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><mask id="r"><image href="data:image/png;base64,${mark}" x="9" y="5" width="110" height="110"/></mask></defs><rect width="128" height="128" rx="21" fill="#53182b"/><rect x="5" y="5" width="118" height="118" rx="17" fill="none" stroke="#d7b66f" stroke-opacity=".4"/><rect width="128" height="128" fill="#e0c389" mask="url(#r)"/><rect x="53" y="104" width="22" height="13" rx="1" fill="none" stroke="#d7b66f" stroke-width="1.6"/><circle cx="64" cy="110.5" r="4" fill="none" stroke="#d7b66f" stroke-width="1.4"/><path d="M53 110.5h7m8 0h7" stroke="#d7b66f" stroke-width="1.4"/></svg>`;
await fs.writeFile("public/icon.svg", icon);

// Keep the 16px favicon focused on the supplied R, without tiny decorative details.
const smallIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><mask id="r"><image href="data:image/png;base64,${mark}" x="5" y="5" width="118" height="118"/></mask></defs><rect width="128" height="128" rx="23" fill="#53182b"/><rect width="128" height="128" fill="#e0c389" mask="url(#r)"/></svg>`;
await fs.writeFile("public/identity/favicon-small.svg", smallIcon);
