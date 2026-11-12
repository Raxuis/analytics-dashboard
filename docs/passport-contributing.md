# Modifier le passeport

## Ajouter un pays

Le fichier à éditer est `src/components/passport/travel-content.ts`. Ajoute un objet à la liste `travels` :

```ts
{
  country: 'FRA',
  visits: 2,
  places: ['Paris', 'Lyon'],
  cities: [
    {
      name: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      note: 'Sur les rives de la Seine.',
    },
  ],
},
```

Cet exemple est illustratif : n'ajoute que les voyages réellement faits. `visits`, `places`, `cities` et `note` sont facultatifs. L'ordre des objets donne l'ordre des pages. Une page est créée par pays et les pages sont réunies par deux, après l'identité et les liens. Un dernier côté sans pays reste une page de papier, pas une destination inventée. La couverture arrière reste accessible après le dernier pays. Le compteur, les boutons, le glissement, les textures 3D et la vue simple se mettent à jour à partir de cette même liste.

Le nom français et la silhouette pointillée existent déjà pour **177 codes**. Voir [la liste des pays](passport-countries.md). L'éditeur propose les codes et TypeScript signale une faute. Tu n'as pas à dessiner de SVG, régler de coordonnées de texture ou toucher au code Three.js. Seules les silhouettes des pays utilisés sont chargées par la scène.

## Ajouter une ville

Ajoute un objet dans `cities` du pays concerné. Les coordonnées sont en degrés décimaux WGS84 : latitude nord positive, longitude est positive. Les valeurs négatives correspondent au sud et à l'ouest. Le point et ses ondes sont placés automatiquement avec la même projection que la silhouette.

`note` est le court texte de l'infobulle. Les villes sont accessibles au survol et au toucher dans la scène. Dans la vue simple, elles sont également accessibles au clavier ; Échap ferme l'infobulle focalisée. Ne mets pas de données personnelles dans les notes.

## Changer les liens

Édite `src/components/passport/destinations.ts`. Les visas, les liens directs et le suivi utilisent les mêmes identifiants. Ajouter un nouveau type de lien demande aussi d'ajuster sa région imprimée dans `passport-layout.ts` et la validation de l'endpoint analytics.

## Prévisualiser et vérifier

```sh
npm run dev
npm test
npm run build
```

## Actualiser les silhouettes

Les SVG sont préparés et disponibles hors ligne dans `public/identity/countries`. Le catalogue français et les paramètres de projection sont dans `country-catalog.json`. Les contours proviennent de Natural Earth, dans le domaine public. Les États et territoires absents à l'échelle 1:110m ne figurent pas dans cette liste.

```sh
npm run countries:generate
```

Cette commande télécharge la source publique Natural Earth et régénère les silhouettes, le catalogue et la liste des codes. Elle n'est nécessaire ni pour ajouter un voyage avec un code existant, ni pour lancer le site. Ne modifie pas les fichiers générés à la main ; ils seraient remplacés lors de cette commande.

La précision des contours est adaptée à une page de passeport, pas à une carte de navigation. Plusieurs villes très proches peuvent avoir des ondes qui se recouvrent ; leur point central reste ciblable individuellement et la vue simple donne accès à chaque infobulle.

Les États-Unis utilisent trois projections coordonnées : continent, Alaska et Hawaï. Une ville ajoutée en Alaska ou à Hawaï sera placée dans le bon encart automatiquement.
