import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest, type NextFetchEvent } from "next/server";
import middleware from "../middleware";
import { translate } from "../src/i18n/language";
import { languageFromRequest } from "../src/i18n/routing";
import { passportMetadata } from "../src/i18n/metadata";
import { LanguageProvider } from "../src/i18n/LanguageProvider";
import { SimplePassport } from "../src/components/passport/SimplePassport";

test("language selection uses an exact English host or an explicit English path", () => {
  assert.equal(languageFromRequest("passport.raphaelraclot.dev", "/"), "en");
  assert.equal(languageFromRequest("passeport.raphaelraclot.dev", "/"), "fr");
  assert.equal(languageFromRequest("localhost:3010", "/en/analytics"), "en");
  assert.equal(languageFromRequest("passport.raphaelraclot.dev.evil.test", "/"), "fr");
});
test("English hosts rewrite once and keep language headers through to the server", () => {
  for (const [path, target] of [["/analytics", "/en/analytics"], ["/en/analytics", null]] as const) {
    const response = middleware(new NextRequest(`https://passport.raphaelraclot.dev${path}`), { waitUntil() {} } as unknown as NextFetchEvent);
    assert.equal(response.headers.get("x-middleware-request-x-passport-locale"), "en");
    assert.equal(response.headers.get("x-middleware-rewrite"), target ? `https://passport.raphaelraclot.dev${target}` : null);
  }
});
test("translations cover country names, printed capitals, counts and existing memories", () => {
  assert.equal(translate("CORÉE DU SUD", "en"), "SOUTH KOREA");
  assert.equal(translate("3 séjours", "en"), "3 stays");
  assert.equal(translate("1 visite", "en"), "1 visit");
  assert.equal(translate("2 sur 3", "en"), "2 of 3");
  assert.equal(translate("Ma troisième fois à Tokyo, en solo.", "en"), "My third time in Tokyo, travelling solo.");
  assert.equal(translate("Séoul", "en"), "Seoul");
  assert.equal(translate("PASSEPORT", "fr"), "PASSEPORT");
});
test("native English pages translate document labels and actual travel content", () => {
  const html = renderToStaticMarkup(React.createElement(LanguageProvider, { locale: "en", children: React.createElement(SimplePassport, { uv: true }) }));
  assert.match(html, /Personal passport/);
  assert.match(html, /Surname/);
  assert.match(html, /South Korea/);
  assert.match(html, /3 stays/);
  assert.match(html, /California, Florida, New York/);
  assert.doesNotMatch(html, /Villes visitées|Prénom|Corée du Sud|séjours/);
});
test("each language advertises its own canonical domain and reciprocal alternates", () => {
  const fr = passportMetadata("fr"), en = passportMetadata("en");
  assert.equal(fr.alternates?.canonical, "https://passeport.raphaelraclot.dev");
  assert.equal(en.alternates?.canonical, "https://passport.raphaelraclot.dev");
  assert.deepEqual(fr.alternates?.languages, en.alternates?.languages);
});
