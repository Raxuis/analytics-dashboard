# Raxuis Passport

English · [Français](README.fr.md)

A personal gateway to Raphaël Raclot’s portfolio, GitHub, LinkedIn and X. The passport is drawn and animated with Three.js, React Three Fiber and GSAP. Pages and materials are generated locally, without an external 3D model or rendering service. HTML links remain available while loading and without WebGL.

[Open the English passport](https://passport.raphaelraclot.dev) · [Ouvrir le passeport français](https://passeport.raphaelraclot.dev)

## Development

Requires Node.js 20.9 or later.

```sh
npm ci
npm run dev
```

Open http://localhost:3000 for French or http://localhost:3000/en for English. **Links** opens the destinations directly and provides **Simple view** for a presentation without 3D. The simple view includes all four links and the travel pages, with a return to the interactive scene.

The interface respects reduced motion. Rendering runs on demand; there is no continuous animation loop while the object is idle.

```sh
npm test
npm run lint
npm run build
npm start
```

## Languages

`passport.raphaelraclot.dev` serves English and `passeport.raphaelraclot.dev` serves French. Both are connected to the same Vercel project through Porkbun CNAME records. The portfolio’s main domain keeps its existing configuration.

The discreet **EN** or **FR** header link switches languages. Localized pages, canvas lettering, city tooltips, UV memories, reading mode, discovery hints, the register and sharing metadata use the same language. Country names come from ISO data and `Intl.DisplayNames`. Both hosts share the same anonymous counters; internal rewrites do not count a visit twice.

- `src/i18n/en.json`: English translations of the original French copy.
- `src/i18n/routing.ts`: language and domain routing.
- `src/i18n/metadata.ts`: localized titles, descriptions, canonical URLs and reciprocal language links.
- `src/components/passport/travel-content.ts`: the original personal travel data, unchanged by translation.

## Identity and artwork

The original R logo is preserved in `public/identity/raxuis-logo.png`. The favicon adapts its exact silhouette in gold on burgundy. The cover uses a vector adaptation of the French passport emblem, with its source and CC BY-SA 4.0 attribution in [the artwork credits](public/identity/sources/ATTRIBUTION.md).

```sh
npm run icons
npm run social:generate
npm run flags:generate
npm run countries:generate
```

The icon command produces ICO sizes 16, 32 and 48, the Apple icon and a PNG preview. Social previews are generated at 1200 × 630 in `public/social/passport.png` and `public/social/passport-en.png`. Flags are local 4:3 SVGs from the pinned MIT-licensed `flag-icons` package. There are no flag emojis or external runtime requests.

DM Sans, Space Grotesk and OCR B are self-hosted with their licenses in `public/fonts`. Destinations and click recording are defined in `destinations.ts`; printed materials in `passport-textures.ts`; geometry, shaders and interaction in `PassportScene.tsx`.

## Travel contributions

Edit countries, cities and UV memories in `src/components/passport/travel-content.ts`. Pages are created automatically. There are 177 prepared country silhouettes and a local flag catalog; country codes select the matching assets automatically.

See the [contribution guide](docs/passport-contributing.md) and [country codes](docs/passport-countries.md). Add English translations for new notes to `src/i18n/en.json`. Existing personal details are not replaced with invented content.

## Interaction and reading

Covers and sheets follow dragging and can return to their original position before release. Cancellation or loss of focus does not complete a gesture. On small screens, **Read** opens one selectable HTML page at a time, with navigation, UV memories and accessible links. Closing it or pressing Escape returns to the corresponding spread and restores focus after its transition.

First visits receive contextual hints for opening the cover, dragging pages, exploring a city and using UV. Each hint is remembered separately under `raxuis.passport.discovery.v1` in local storage. Visitors who discover an action themselves skip its explanation. Motion is brief, interruptible and does not loop; reduced motion retains the text. The rules live in `discovery-state.ts`, timing in `usePassportDiscovery.ts` and 3D effects in `DiscoveryMotion.tsx`.

## Analytics

Copy `.env.example` to `.env.local` and set the server-side Upstash REST variables, or configure their equivalents in Vercel. Never prefix them with `NEXT_PUBLIC_` or expose them to the browser.

Recommended names are `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Vercel Marketplace’s `KV_REST_API_URL` and `KV_REST_API_TOKEN` are also supported and take priority over native or legacy Redis variables. The historical `REDIS_KEY` fallback remains for compatibility. Production uses a new free Upstash database connected to the Vercel project.

Middleware records homepage views in the background. Links send separate events to `/api/events` without delaying navigation. Redis requests abort after 1.8 seconds without automatic retries. Data is retained for seven days and aggregated in UTC. These remain page loads and link activations, not unique people. Known bots, localhost, previews and opted-out owner tests are excluded from new measurements; historical figures can include them.

The public, non-indexable `/analytics` register displays real aggregate data. The English path is `/en/analytics` locally. UV or selecting a visa reveals click sources between the passport and direct links. Refresh reloads the data in place. An unavailable store produces an unavailable state, never fabricated zeroes. Country silhouettes reuse the passport assets; a country without a silhouette retains its name and code. On phones, the two sheets stack vertically.

The register also exposes separate, ordered session funnels under **Passport journeys**. Umami Cloud Hobby supplies the private dashboard for explicit interaction events. See [measurement, exclusions and setup](docs/analytics-measurement.md) for definitions and verification.

Anonymous counters are not a trusted basis for billing or critical decisions. Local checks do not prove production database availability; verify production configuration and logs before publishing.

## Design and delivery

The approved direction keeps the passport centered, almost alone, with discreet controls and a compact links panel. `PRODUCT.md`, `DESIGN.md` and `.impeccable/surfaces/app-page-tsx.md` record that direction. Editorial wrappers, slogans and decorative captions should not be reintroduced.

Specifications and plans live in `docs/superpowers`; [the finishing checklist](docs/passport-polish.md) tracks the presentation pass. The original 504 investigation is in `docs/superpowers/specs/2026-11-12-analytics-diagnosis.md`. GitHub’s Vercel integration deploys `main` automatically.

Tests cover Redis cancellation and configuration, storage failures, aggregation, event validation, page geometry, gestures, native reading and first-visit discovery.
