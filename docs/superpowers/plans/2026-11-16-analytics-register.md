# Registre des passages

Direction approuvée : registre ouvert sur fond charbon, reliure bordeaux, papier ivoire et visas de la page du passeport. Référence visuelle : maquette du registre générée dans cette conversation le 16 novembre 2026. Les données de la maquette sont illustratives ; le site conserve exclusivement les données Redis.

- [ ] Enrichir l’agrégation avec les clics par jour et leur origine, sans changer la collecte ni la conservation de sept jours. Tester les dates manquantes et les deux origines.
- [ ] Remplacer AnalyticsDashboard et la page analytics par un registre HTML accessible. Tableau à gauche, visas et silhouettes existantes à droite. Pays sans silhouette : nom lisible, aucune forme inventée.
- [ ] Ajouter une commande Actualiser et une inspection UV de l’origine des clics. Ne pas proposer de périodes expirées. Conserver un état de panne explicite sans faux zéros.
- [ ] Adapter les deux feuilles en pile sur téléphone. Vérifier données réelles, absence de données, panne, grands nombres, interactions, clavier, grand écran et 320 pixels.
- [ ] Faire la revue visuelle, commiter progressivement, publier et vérifier la collecte en production.

Les composants sont responsables de l’affichage et des commandes. src/utils/analytics.ts reste responsable des calculs. La base, les secrets et le suivi des clics du passeport restent inchangés.
