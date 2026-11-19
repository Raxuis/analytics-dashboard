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

La précision des contours est adaptée à une page de passeport, pas à une carte de navigation. Plusieurs villes très proches peuvent avoir des ondes qui se recouvrent ; la vue simple propose aussi un bouton par nom de ville sous la carte, pour sélectionner chacune indépendamment au toucher.

Les États-Unis utilisent trois projections coordonnées : continent, Alaska et Hawaï. Une ville ajoutée en Alaska ou à Hawaï sera placée dans le bon encart automatiquement.

La liste des villes sous chaque carte conserve une seule ligne et défile horizontalement si nécessaire. Tu peux donc ajouter des villes sans modifier la mise en page. Chaque nom reste accessible au clavier et au toucher.

### Souvenirs sous lumière UV

Ajoute `uvNote: "Ton souvenir réel en une phrase."` à une ville pour remplacer sa description au survol quand l’UV est actif. Le champ `note` reste la description en lumière normale. Une ville avec `uvNote` porte un cercle fluorescent supplémentaire pour signaler le souvenir.

Le même champ `uvNote` sur un pays imprime une courte note cachée sur sa carte. Garde cette note à trois lignes environ. Les marques fluorescentes de séjour viennent automatiquement de `visits`. Sans nombre fourni, la page indique seulement « Visité ».

En 3D, active **UV**, puis déplace la souris ou glisse le doigt sur le papier. Ce glissement sert à la lampe ; les boutons restent disponibles pour tourner les pages. **Tout éclairer** révèle la double page entière et rétablit le glissement des pages. **Lampe** revient à l’éclairage local. En vue simple, **Lumière UV** révèle directement les souvenirs avec les mêmes boutons de villes accessibles au clavier.

### Lecture sur téléphone

Le lecteur plein écran utilise les mêmes données que le passeport et la vue simple. Il présente l’identité, les visas puis une page par pays. L’ajout d’un voyage met automatiquement à jour le nombre de pages et la navigation du lecteur, sans modifier `PassportReader.tsx`. Les clics sur ses visas sont comptés comme des clics depuis le passeport.

## Drapeaux

Les drapeaux sont des SVG locaux au format 4:3, issus de `flag-icons` sous licence MIT. Le code pays utilisé par les voyages suffit : la correspondance alpha-3 vers alpha-2 est automatique. Les 271 assets sont préparés dans `public/identity/flags` et se régénèrent avec `npm run flags:generate`. Aucun emoji ni service externe au chargement. Les drapeaux accompagnent le nom sans le remplacer, et sont décoratifs pour les lecteurs d’écran.

Le registre utilise les masques pleins dans `public/identity/country-masks` pour dessiner ses pointillés une seule fois. `npm run countries:generate` régénère ces masques avec les silhouettes du passeport. La France dispose d’un cadrage métropolitain avec la Corse, puis d’un encart séparé pour la Guyane ; les villes restent projetées dans la bonne région.
