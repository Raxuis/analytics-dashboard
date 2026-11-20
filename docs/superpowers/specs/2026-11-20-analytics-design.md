# Passport measurement

Approved direction: separate page loads from sessions, exclude owner tests and known bots, measure passport exploration and direct link use separately, and prepare Umami integration without changing the passport design.

A session is an anonymous browser-tab session, renewed after 30 minutes without interaction. It is not a person. No cross-domain visitor matching. Events have random IDs, fixed names and bounded properties. Retransmissions are deduplicated atomically. Daily aggregate counters and short-lived session milestones stay server-side; the public register never exposes identifiers or individual journeys. Existing page-load history remains separate.

Record scene readiness, opening, spread changes, cities, UV, direct menu, simple view, reader, outgoing links and foreground active-time buckets. Passport and direct-menu funnels share arrival as their denominator, but keep separate completion milestones. Never block navigation for measurement. Collection errors remain failures rather than fabricated zeroes.

Hosting decision approved: Umami Cloud Hobby for private analytics, existing Redis for the separate public register. The EU website is configured after the user completed account sign-in. Cloud API access is unnecessary; no paid service is created. Keep sanitized event mapping and documented configuration.
