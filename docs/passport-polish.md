# Finition du passeport

Passe demandée le 16 novembre 2026. Direction conservée : le passeport au centre, presque seul, cuir bordeaux, dorure, pages imprimées et commandes discrètes. Aucun nouveau contenu personnel ne sera inventé ou ajouté.

## Interactions
- [x] Couvertures avant et arrière manipulables pendant le glissement, avec retour en arrière avant relâchement.
- [x] Même règle de validation du geste pour les feuilles et les couvertures.
- [x] Annulation propre du geste et absence de seconde animation après validation.
- [x] Commandes et liens protégés pendant les transitions, clics de villes et visas préservés.

## Document et matières
- [x] Marges, folios, contrastes et typographie harmonisés.
- [x] Papier fin, tranche et couture discrète.
- [x] Cuir mat et reflets métalliques contenus.

## Lecture mobile
- [x] Lecture plein écran d’une page, texte sélectionnable et villes utilisables au toucher.
- [x] Navigation entre pages, UV, sortie explicite vers la double page correspondante.
- [x] Clavier, focus, fermeture avec Échap et réduction des animations respectés.

## Partage
- [x] Image d’aperçu dédiée aux messageries et réseaux.
- [x] Titre, description et métadonnées de partage cohérents.
- [x] Favicon simplifié à 16 pixels, identité conservée.
- [x] Adresse dédiée : https://passeport.raphaelraclot.dev. CNAME ajouté chez Porkbun, configuration et HTTPS vérifiés côté Vercel.

## Vérification et publication
- [x] Tests des gestes, des limites de pages et des métadonnées.
- [x] Vérifications visuelles ordinateur et petits écrans, chargement, erreur et mode simple.
- [x] Revue finale, commits progressifs et contrôle en production.

## Contenu à remplir plus tard par Raphaël

Le fichier `src/components/passport/travel-content.ts` reste la source des voyages, villes et souvenirs UV. Les deux anecdotes existantes restent présentes. Les photos, sports, nouveaux pays et récits ne font pas partie de cette passe. Aucun emplacement fictif ne sera affiché aux visiteurs.

## Vérifications locales

17 novembre 2026 : 33 tests passent, lint et TypeScript valides, build de production réussi. Contrôles réels à 1280, 390 et 320 pixels : gestes annulables, couvertures, limites du lecteur, souvenir UV de Tokyo, défilement des villes et retour du focus. Le détecteur ne relève aucun défaut principal ; ses remarques de palette concernent les encres et papiers du document conservé.

## Livraison

Revue finale : **ship**, aucun défaut matériel relevé. Commits fonctionnels `1d5f282` et `a497f4d`, publiés sur `main`. Vercel confirme le déploiement `dpl_BPWBYqWxpSEveMtPeyt9Tc2qEzin` prêt. Le 17 novembre 2026, contrôles sur le domaine dédié : accueil et registre HTTP 200, canonique correct, image 1200 × 630 HTTP 200, favicon à trois tailles HTTP 200, collecte de clic HTTP 204. Le lecteur mobile publié, le portrait et le retour vers le passeport ont été vérifiés dans le navigateur. Aucun nouveau contenu personnel ajouté.
