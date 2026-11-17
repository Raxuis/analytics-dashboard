# Passeport Raxuis

Une porte d’entrée personnelle vers le portfolio de Raphaël Raclot, GitHub, LinkedIn et X. Le passeport est dessiné et animé avec Three.js, React Three Fiber et GSAP. Les pages et matières sont produites localement, sans modèle 3D ni service externe. Les liens HTML restent disponibles pendant le chargement et sans WebGL.

## Développement

Node.js 20.9 ou plus récent.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:3000. Le bouton « Liens » ouvre les destinations directes et donne accès à « Vue simple » pour utiliser la présentation sans 3D. La vue simple présente les pages HTML avec les quatre liens et les voyages, et un retour à la scène interactive. L’interface respecte la préférence de réduction des animations. Le rendu fonctionne à la demande, sans boucle d’animation permanente lorsque l’objet est immobile.

```sh
npm test
npm run lint
npm run build
npm start
```

## Identité

Le R d’origine est conservé dans `public/identity/raxuis-logo.png`. Le favicon SVG adapte exactement sa silhouette en dorure sur une couverture bordeaux. `npm run icons` régénère l’emblème personnel, puis génère le favicon ICO aux tailles 16, 32 et 48 pixels, l’icône Apple et un aperçu PNG.

Les polices DM Sans et Space Grotesk sont distribuées localement avec leurs licences dans `public/fonts`. Le texte, les destinations et la mesure des clics sont définis dans `src/components/passport/destinations.ts`. Les matières imprimées sont dans `passport-textures.ts`; la géométrie, les shaders et les animations sont dans `PassportScene.tsx`.

## Statistiques

Copier `.env.example` vers `.env.local` et renseigner les variables Upstash côté serveur, ou configurer leurs équivalents dans Vercel. Ne jamais les préfixer avec `NEXT_PUBLIC_` ni les envoyer au navigateur.

La configuration recommandée utilise `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`. Les noms `REDIS_URL` et `REDIS_KEY` sont également acceptés. Le déploiement historique utilisant uniquement `REDIS_KEY` conserve son endpoint d’origine comme repli; migrer vers une URL explicite est recommandé.

Le middleware enregistre les vues de l’accueil en arrière-plan. Les liens envoient un événement distinct vers `/api/events` sans retarder la navigation. Les requêtes Redis sont interrompues après 1,8 seconde, sans nouvelle tentative automatique. Le tableau de bord `/analytics` présente un état indisponible lorsque le service ne répond pas, et n’invente aucun chiffre. Les données sont conservées sept jours et agrégées en UTC. Les statistiques comptent les chargements et clics, pas des visiteurs uniques. Les robots et activations répétées peuvent être inclus.

Ce tableau de bord reste public, comme dans le dépôt d’origine, et n’est pas indexable. Il n’expose que des agrégats. Les compteurs anonymes ne sont pas une source de confiance pour facturation ou décisions critiques. La validation en local ne prouve pas la disponibilité de la base en production; vérifier les variables et les logs Vercel avant publication.

## Choix et validation

La conception validée et le plan figurent dans `docs/superpowers`. Aucun déploiement automatique n’est effectué par ce projet. Les tests couvrent le délai réel d’annulation des appels Redis, la compatibilité de configuration, les erreurs de stockage, l’agrégation et la validation de l’endpoint.

Le diagnostic du 504 en production est consigné dans `docs/superpowers/specs/2026-11-12-analytics-diagnosis.md`. L’ancien endpoint ne résout actuellement plus dans le DNS; sa compatibilité de configuration ne rétablit donc pas les statistiques.

La page d’accueil suit désormais la direction confirmée : le passeport centré, presque seul, des commandes discrètes et un panneau de liens. `PRODUCT.md`, `DESIGN.md` et `.impeccable/surfaces/app-page-tsx.md` consignent cette décision. Aucun habillage éditorial, slogan ou texte d’ambiance ne doit être réintroduit.

## Contribuer au passeport

Les voyages et les villes se modifient dans `src/components/passport/travel-content.ts`. Les pages se créent automatiquement. 177 silhouettes de pays sont déjà préparées. Voir [le guide de contribution](docs/passport-contributing.md) et [les codes pays](docs/passport-countries.md).

## Registre des passages

La page `/analytics` présente les sept derniers jours dans un registre HTML accessible. Les visas montrent les clics par destination ; un clic sur un visa ou le bouton UV révèle leur origine entre passeport et menu Liens. Actualiser recharge les données sans quitter le registre. Les jours suivent UTC, les compteurs restent réels et les pannes ne sont pas remplacées par des zéros. Les silhouettes des pays réutilisent les assets du passeport ; un pays sans silhouette conserve son nom et son code. Sur téléphone, les deux feuilles sont empilées.

## Adresse et partage

Adresse publique dédiée : https://passeport.raphaelraclot.dev. Le domaine reste géré chez Porkbun ; seul le CNAME `passeport` pointe vers le projet Vercel du passeport. Le domaine principal du portfolio conserve sa configuration.

L’identité publique et les métadonnées sont dans `src/lib/site.ts`. `npm run social:generate` recrée l’image Open Graph et Twitter de 1200 × 630 dans `public/social/passport.png`, à partir du blason original et de la police locale. `npm run icons` produit le favicon à plusieurs tailles ; la version 16 pixels utilise un R simplifié, les grandes tailles conservent les détails du passeport.

## Lecture et finition

Sur petit écran, le bouton **Lire** ouvre une seule page HTML en grand, avec navigation entre les pages, souvenirs UV et liens accessibles. Le retour ou la touche Échap ramène à la double page correspondante, puis restaure le focus après sa transition. Les couvertures et les feuilles suivent le glissement et peuvent revenir à leur position initiale avant relâchement. Une annulation ou une perte de focus ne valide pas le geste.

Le suivi de la passe de finition est dans [docs/passport-polish.md](docs/passport-polish.md). Le contenu personnel reste à compléter manuellement dans les données existantes.
