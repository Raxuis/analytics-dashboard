# French and English passport

User request: keep passeport.raphaelraclot.dev and add passport.raphaelraclot.dev with an English version.

- [x] Add the English domain in Vercel and its CNAME in Porkbun.
- [x] Route the English host to `/en` internally, preserving `/analytics` and click tracking on both hosts. Keep explicit `/en` paths usable locally.
- [x] Add a shared French and English dictionary, localized country names, native document, canvas textures, city notes, discovery, register, metadata and social preview.
- [x] Add a quiet language link in the header, retaining the corresponding page.
- [x] Verify French and English desktop/mobile, host routing, metadata, clicks and domain HTTPS. Build, tests, final review, commit and publish.

No personal facts change. The original French data remain the contribution source; supplied memories are translated faithfully. No new dependency. French remains the default on existing addresses. Each language has its own canonical domain, with reciprocal hreflang links and the correct HTML lang.

## Validation du 19 novembre 2026

40 tests passent, lint et build validés. Le routage par Host est contrôlé en HTTP avec les deux domaines ; `/en` reste accessible localement. Le header HTML, les titres, URL canoniques et liens réciproques suivent la langue. Parcours réel : scène 3D anglaise, lecteur mobile avec souvenir UV de Tokyo, registre anglais indisponible en local et vue simple française. Le domaine anglais est vérifié chez Vercel, CNAME valide. README.md est en anglais par défaut, README.fr.md contient la version française, avec liens réciproques.

Revue finale : **ship**, aucun défaut matériel relevé. Les métadonnées du registre anglais ont également leur titre, description et URL propres.

## Publication

Commit fonctionnel `5a86236`, déploiement Vercel `dpl_YWgzN2zi9ubkPWoaiqn3t1DMo2g6` prêt le 19 novembre 2026. Sur les deux domaines : accueil et registre HTTP 200, langues HTML et titres corrects, images de partage 1200 × 630 HTTP 200, collecte des clics HTTP 204 avec écriture réelle. Le changement FR vers EN puis EN vers FR est vérifié dans le navigateur publié. Le registre anglais affiche les données réelles et ne déborde pas à 320 pixels.
