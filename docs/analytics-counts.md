# Analytics interpretation and France rendering

Checked 19 November 2026 after a report that France did not show and the visitor total looked unexpectedly large.

## France

The French outline previously fitted metropolitan France and French Guiana into a single transatlantic bounding box. Metropolitan France was consequently tiny. The registry also masked its stipple pattern with an already stippled SVG, reducing visibility further at small sizes.

France now has a full-size metropolitan projection (including Corsica) and a separate French Guiana inset. The registry uses solid country masks and paints its stippling once. All 177 prepared countries have matching masks. Obsolete image rules that enlarged flags to silhouette size are removed; flags retain their shared 24 × 18 size. Generation remains `npm run countries:generate`.

## What the counters mean

At the initial check, the seven-day register contained **323 page loads and 4 outbound link activations**. These are not unique people. The original middleware counted homepage requests, including repeated loads, bots, automated checks and preloads missed by its filter. It does not record an identifier, session or user-agent in the aggregate data. The two language domains share this counter. Our production checks contributed page loads and test click activations.

The available Vercel log sample contained 21 requests (13 homepage requests, one explicit English homepage, five register reads and two event submissions). There were no user-agent fields in that sample. It does not cover or explain every historical load, so a human-versus-bot proportion cannot be reconstructed. A country is the request's network geolocation, not proof of the visitor's nationality or physical location.

Historical values remain intact. No estimate of unique visitors is invented and no bot volume is guessed or subtracted. The register now states beside its heading that it counts page loads, not unique visitors. The existing detailed method explains repeated and automated traffic.

## Prefetch diagnosis and correction

A local request proxy confirmed that the register preloads the homepage with `RSC: 1`, `Next-Router-Prefetch: 1`, `Accept: */*` and `Sec-Fetch-Dest: empty`. Temporary middleware instrumentation showed Next.js 14 normalizing away the internal RSC/prefetch headers before the application middleware could inspect them. The bilingual middleware's in-function prefetch filter therefore missed those requests.

Future pageview writes require a GET document navigation: browser destination `document`, or a missing destination with `Accept: text/html`. Empty-destination fetches, RSC responses, prefetched documents, HEAD and asset requests are excluded. Language rewrites still apply to every matched request. This fixes inflated background loads, without claiming deduplication or reliable bot detection. Browser tests and bots requesting HTML documents can still count. Historical values remain unchanged.

The register’s two home links now use native document navigation, avoiding automatic homepage preloads and ensuring a deliberate return to the passport can still count as a document load.

## Verification

44 tests pass, production build and lint/type checks pass. In an HTTP regression check against the built server, three RSC/prefetch requests left the aggregate unchanged at 335 loads across three successive reads. France is visible in the real register at mobile size; flags measure 24 × 18 pixels. Both French and English explanatory notes are checked. Final review: ship.
