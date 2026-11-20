# Passport measurement

## Two complementary views

The public passport register keeps the existing seven-day Redis page-load and outgoing-click history. Its expandable **Passport journeys** ledger adds anonymous session aggregates in a separate namespace. Old page loads are never relabelled as people or sessions.

Umami Cloud Hobby provides the private analytics dashboard. Both passport domains use one website and can be filtered by hostname. No paid API, session replay or public sharing is enabled. The configured website is in the EU region. The public register does not need access to Umami's API.

## Sessions and funnels

A Redis session belongs to a browser tab, persists across reloads on the same origin and expires after 30 minutes without interaction. Ordinary pointer, touch and keyboard activity refreshes it. Browser storage failure falls back to memory. Switching between the English and French domains starts a separate session. Sessions are not unique people. Umami uses its own session definition, so its totals can differ.

The two session funnels are ordered:

- Arrival, scene ready, passport opened, another spread or city explored, outgoing scene link.
- Arrival, links menu opened, outgoing direct link.

A link clicked before exploration cannot become a completed exploration funnel later. The same session can complete both paths. Milestones count once per session; outgoing event totals can include several real clicks. Each submission has an event UUID and the server atomically deduplicates it for seven days. A session accepts at most 300 submissions. Public counters are anonymous telemetry, not proof that a human visited; user-agent filtering catches known bots, not every automation.

Foreground active-time milestones are 15, 30, 60, 120 and 300 seconds. Hidden tabs, timer suspension and inactivity beyond 30 seconds do not accrue time. Reloading restarts the active-time accumulator, without duplicating already-counted milestones in the same session.

## Exclude your own visits

Open each domain once with `?analytics=off`. This sets a host-only exclusion cookie for one year. Subsequent page loads, interactions and clicks are excluded from both collectors. Use `?analytics=on` to resume. Localhost and Vercel preview hosts are always excluded. Private browsing and another browser need their own exclusion setting. Do not use this preference as authentication; it only opts that browser out of telemetry.

## Event vocabulary

`arrival`, `scene_ready`, `scene_error`, `passport_open`, `spread_view`, `city_view`, `uv_enable`, `links_open`, `simple_view`, `reader_open`, `outbound`, `active_time`.

Event properties are bounded and validated. Attribution is the first valid `utm_source`, otherwise the referring hostname or `direct`. No full referrer URLs, query strings, email addresses, raw IP addresses or persistent person IDs are sent by our event bridge. Umami receives a sanitized page URL, hostname, language, source and event properties. Network requests necessarily expose connection metadata to the analytics provider; these are not copied into our register.

## Umami setup

Production uses `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. These are public tracker settings, never API credentials. Blank settings disable only Umami. The local register and navigation work independently. The tracker loads after the experience mounts; early events are queued with a 100-event cap. Automatic tracking is disabled; our bridge sends one sanitized page load per document and explicit events. Failure or blocking of either collector does not block links or the passport.

For detailed analysis in Umami, filter events by name, `detail`, `placement`, `locale` and `source`. Umami names outgoing events `outbound_scene` and `outbound_direct` so private funnels can distinguish the two paths without a paid API. Two saved reports are configured in Umami: **Passport exploration** (arrival, scene ready, opened, spread viewed, scene link) and **Direct links** (arrival, menu, direct link). The public exploration milestone also accepts city discovery. For campaign links, add a short `utm_source`, for example `?utm_source=github`. Campaign, medium and content attribution can be added later if there is an actual reporting need.

## Verification

`npm test` validates the endpoint, input policy and exclusions. `npx tsx scripts/check-journey-store.ts` is an opt-in integration check requiring Redis credentials. It uses isolated random QA keys, checks real atomic duplicate protection and reversed funnel sequences, and removes those temporary keys in `finally`. It never writes public counters. The initial successful integration check ran on 20 November 2026.
