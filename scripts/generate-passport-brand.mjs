import fs from "node:fs/promises";
const mark = (await fs.readFile("public/identity/raxuis-logo.png")).toString(
  "base64",
);
let foliage = "";
for (const direction of [-1, 1]) {
  let branch = "";
  for (let i = 0; i < 11; i++) {
    const t = i / 10;
    const x = 256 + direction * (48 + 120 * Math.sin(t * 1.7));
    const y = 415 - 275 * t;
    branch += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
    for (const side of [-1, 1]) {
      foliage += `<ellipse cx="${(x + direction * side * 14).toFixed(1)}" cy="${(y - 7).toFixed(1)}" rx="8" ry="23" transform="rotate(${direction * (side * 38 - t * 30)} ${x + direction * side * 14} ${y - 7})" fill="none" stroke="white" stroke-width="3"/>`;
    }
  }
  foliage += `<path d="${branch}" fill="none" stroke="white" stroke-width="4"/>`;
}
const crest = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><mask id="r"><image href="data:image/png;base64,${mark}" x="91" y="67" width="330" height="330"/></mask></defs>${foliage}<g stroke="white" fill="none"><path d="M167 125Q256 145 345 125L331 275Q321 339 256 379Q191 339 181 275Z" stroke-width="4"/><path d="M179 139Q256 158 333 139L320 274Q310 327 256 365Q202 327 192 274Z" stroke-width="2"/><path d="M208 424Q256 401 304 424M219 434Q256 414 293 434" stroke-width="4"/><path d="M256 54V89M238 71H274M244 59L268 83M268 59L244 83" stroke-width="3"/></g><rect width="512" height="512" fill="white" mask="url(#r)"/></svg>`;
await fs.writeFile("public/identity/passport-crest.svg", crest);
const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><mask id="r"><image href="data:image/png;base64,${mark}" x="9" y="5" width="110" height="110"/></mask></defs><rect width="128" height="128" rx="21" fill="#53182b"/><rect x="5" y="5" width="118" height="118" rx="17" fill="none" stroke="#d7b66f" stroke-opacity=".4"/><rect width="128" height="128" fill="#e0c389" mask="url(#r)"/><rect x="53" y="104" width="22" height="13" rx="1" fill="none" stroke="#d7b66f" stroke-width="1.6"/><circle cx="64" cy="110.5" r="4" fill="none" stroke="#d7b66f" stroke-width="1.4"/><path d="M53 110.5h7m8 0h7" stroke="#d7b66f" stroke-width="1.4"/></svg>`;
await fs.writeFile("public/icon.svg", icon);
