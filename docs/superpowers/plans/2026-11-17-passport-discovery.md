# Passport discovery implementation plan

**Goal:** Make opening, dragging, city exploration and UV understandable on a first visit.

**Architecture:** A small discovery hook owns persisted hints and timing. An isolated Three.js component animates existing cover and page geometry and draws a temporary ring over a real city. PassportExperience owns the accessible text and passes only the active cue into the scene.

**Constraints:** Preserve the passport and existing navigation. No extra dependency, invented content, blocking tutorial, slash separator or em dash in interface copy. Reduced motion uses text only.

- [ ] Create `usePassportDiscovery.ts`: versioned per-cue storage, cancellable delayed text, visibility and overlay suppression. Test storage parsing and candidate rules.
- [ ] Create `DiscoveryMotion.tsx`: one cycle of cover lift, local page corner deformation, and city ring. Restore transforms and geometry on cleanup; stop on pointer input.
- [ ] Wire scene props and document refs; add a quiet dismissible status above controls in `PassportExperience.tsx` and `app/globals.css`.
- [ ] Verify fresh arrival, quick interruption, return visit, mobile and reduced-motion paths. Run tests, lint, build and one detector pass. Obtain final finish review, commit and publish.
