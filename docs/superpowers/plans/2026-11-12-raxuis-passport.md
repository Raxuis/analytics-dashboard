# Raxuis Passport Implementation Plan

> **For agentic workers:** Use executing-plans to implement the following tasks. Analytics can be delegated independently with ownership restricted to its server files and dashboard.

**Goal:** Ship the approved interactive passport locally with branded favicon and resilient analytics.

**Architecture:** Next.js HTML shell contains immediate destination links and a dynamically imported React Three Fiber canvas. Canvas textures provide printed paper, identity and visas; hinged page geometry and GSAP provide opening and turning. Client controls share state with the accessible shell. Server analytics uses bounded Upstash requests and background middleware collection.

**Tech Stack:** Next.js 14, React 18, Three.js, React Three Fiber 8, GSAP, CSS, Upstash Redis.

## Global Constraints
French concise copy; no slash separators or em dashes in displayed text. Actual portfolio domain raphaelraclot.dev. Real R logo. Respect reduced motion, keyboard, touch, WebGL failure. No artificial loading delay, invented metrics or deployment. Preserve Redis secrets server-side.

## Task 1: Dependencies and identity
- [x] Add compatible fiber 8, Three.js, GSAP and types. Keep a single npm lockfile.
- [x] Copy actual R logo into public. Create a project SVG favicon preserving its silhouette and raster equivalents.
- [x] Replace metadata and global styles with passport identity. Remove stale social image.

## Task 2: Passport scene and HTML shell
- [x] Create src/components/passport/{PassportExperience,PassportScene,passport-textures,destinations}. Separate canvas scene, procedural textures and controls.
- [x] Render a navy leather cover, metallic R, embossed title, stitched border, curved pages and two doublespreads with portrait and destinations.
- [x] Animate opening and page flips with GSAP, reveal UV patterns through material opacity and emissive light.
- [x] Provide real loading progress, first-frame readiness, WebGL error boundary and an HTML-only mode. Links work during loading.
- [x] Build responsive editorial shell and immediate HTML destination links, with keyboard controls and reduced motion support.

## Task 3: Analytics resilience
- [x] Replace hardcoded Redis URL with configuration and bounded fetch, no import-time exception when missing.
- [x] Move middleware collection into waitUntil; filter matcher/prefetch.
- [x] Add validated destination click endpoint and non-blocking client beacon.
- [x] Display true pageview labels, unavailable state, destinations and daily counts, with no fake zeros on failure.
- [x] Test unavailable configuration, bounded requests, aggregation and invalid destinations.

## Task 4: Verification
- [x] Run npm build, lint and meaningful analytics tests.
- [x] Inspect desktop/mobile scene using browser screenshots. Verify all links, opening, flips, UV, direct links, fallback and reduced motion.
- [x] Fix visual and runtime findings. Save screenshot proof and document limits around production Redis credentials.

## Vérification réalisée

Build de production, lint et 17 tests réussis. Vérification navigateur sur bureau et mobile à 390 pixels : ouverture, changement de page, retour, UV, sélection de visa et liens directs. Vue simple activée via la commande dédiée puis reprise de la scène. Le mode de réduction des animations est implémenté; aucun test de préférence système sur appareil physique n’a été effectué. Connexion réelle à la base de production non vérifiée faute d’endpoint actif. Diagnostic du 504 documenté séparément.
