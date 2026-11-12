# Passeport Raxuis

## Objectif
Transformer l’accueil de raxuis.vercel.app en une porte d’entrée personnelle vers raphaelraclot.dev, GitHub, LinkedIn et X. Le portfolio existant reste la destination principale. Repartir du dépôt Raxuis/analytics-dashboard, branche main, commit bd17a710b62c57f9ad385cdc0e948b6a52caac89. Les modifications Curio de la session précédente peuvent être remplacées. Une copie locale est conservée dans /tmp/raxuis-before-passport-20261112.

## Direction retenue
Un passeport tridimensionnel posé sur une table sombre. Couverture bleu nuit, papier ivoire, marquage argent holographique et tampons vermillon. Lumière rasante, grain discret, reliure, bords légèrement usés. Utiliser le véritable logo du portfolio, un R blanc sur noir trouvé dans ../modern-portfolio/app/icon1.png. Reprendre sa silhouette pour le marquage de couverture et le favicon. Le favicon adapte le logo sur bleu nuit avec un petit repère vermillon; sa lisibilité à 16 et 32 pixels prime sur les détails.

## Parcours
Le premier écran affiche Raxuis, le texte « Un instant, je prépare tout. », une barre fine et la progression des ressources. Aucun délai artificiel. Une phase de finalisation couvre la préparation des shaders et de la première image. La scène apparaît dès qu’elle est prête. Les liens essentiels sont accessibles pendant le chargement.

Le passeport peut être légèrement orienté et ouvert. Les pages ont une courbure visible pendant leur rotation. Une double page présente le portrait existant, Raphaël Raclot et Raxuis. Une autre présente les destinations sous forme de visas. Le portfolio reçoit le traitement visuel principal. Aucun texte biographique, statut, projet actuel, adresse de contact ou chiffre non fourni ne sera inventé. Les pages projet et notes personnelles sont différées jusqu’à disposer de contenu réel.

Une commande Inspecter active une lumière UV et révèle des motifs de sécurité, des lignes de code décoratives et des annotations. Le bouton fonctionne au clavier et au toucher. Les visas réagissent à la sélection par une animation de tampon qui ne retarde pas l’ouverture des liens. Les destinations restent de vrais liens HTML. Une commande Tous les liens reste visible.

## Contenu et voix
Textes courts en français. Pas de séparateur slash, de tiret cadratin, de slogan générique ou de texte théâtral. Le logo, les matériaux et les interactions portent l’identité. Portfolio : https://raphaelraclot.dev. GitHub : https://github.com/Raxuis. LinkedIn : https://linkedin.com/in/raphael-raclot. X : https://x.com/I_Haruki_I. Pas de formulaire ou d’adresse publique tant qu’une adresse n’est pas fournie.

## Architecture
Conserver Next.js App Router et une coque HTML utilisable sans WebGL. Charger la scène côté client avec Three.js et React Three Fiber dans des composants distincts pour le passeport, les pages, l’éclairage et les commandes. GSAP orchestre les transitions; les shaders gèrent l’holographie et l’UV. Limiter la résolution et les effets coûteux sur mobile, suspendre le rendu quand la scène est immobile ou la page masquée. Le chargement et les erreurs disposent d’états explicites. La préférence de réduction des animations désactive l’introduction et les mouvements non essentiels. Le son est différé pour la première version.

## Analytics
Le dépôt utilise Upstash Redis et non PostHog. Le middleware attend actuellement les écritures Redis, et le tableau de bord n’a pas de borne explicite pour la récupération. Vérifier la configuration côté serveur, borner les requêtes et afficher un état indisponible explicite en cas d’erreur. Ne jamais afficher zéro pour remplacer une panne. Séparer les vues de page des clics sortants et nommer les métriques correctement : les événements existants mesurent des vues, pas des visiteurs uniques. Ne pas exposer de secret au navigateur. Aucun remplacement de fournisseur ni nouvel accès à un compte sans nécessité. Sans accès aux variables et aux logs de production, la cause du 504 et la collecte réelle restent non vérifiées.

## Validation
Vérifier compilation, TypeScript et lint. Contrôler visuellement la scène, le chargement et les interactions en bureau et mobile. Vérifier clavier, réduction des animations, absence de WebGL, échec du chargement et fonctionnement immédiat des liens. Tester les bornes et erreurs Redis, ainsi que le comptage des destinations. Examiner le favicon aux petites tailles. Ne pas publier ni déployer automatiquement.
