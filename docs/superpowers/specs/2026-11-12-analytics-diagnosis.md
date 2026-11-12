# Diagnostic du 504 des analytics

Vérification du 12 novembre 2026. Aucune modification du déploiement ni des variables de production.

## Résultats mesurés

| Cible | Réponse | Délai observé |
| --- | --- | --- |
| https://raxuis.vercel.app/ | 200, cache Vercel HIT | 1,16 s |
| https://raxuis.vercel.app/analytics | 504 FUNCTION_INVOCATION_TIMEOUT | 11,30 s |
| http://127.0.0.1:3010/ | 200, nouveau passeport | 0,04 s |
| http://127.0.0.1:3010/analytics | 200, statistiques indisponibles | 0,06 s |
| Version corrigée sur le port 3011, ancien endpoint avec clé fictive | 200, statistiques indisponibles | 0,107 s |

La version locale corrigée ne dispose pas des identifiants Redis réels. Le succès HTTP confirme la gestion de la panne, pas la collecte de données.

## Preuves en production

Le domaine raxuis.vercel.app pointe vers le projet analytics-dashboard-raxuis, propriétaire harukis-projects-fec210fc, déploiement dpl_GuuSqT9eK3mtmLqP1Yp4igzmg42f du 17 avril 2026. Les logs de la requête hpccx-1794488800729-a09ef8514fee indiquent explicitement :

> Vercel Runtime Timeout Error: Task timed out after 10 seconds

La production contient REDIS_KEY mais aucune URL Redis explicite. Seuls les noms et cibles des variables ont été affichés pendant le diagnostic; aucune valeur secrète n’a été imprimée ni copiée dans le projet.

## Dépendance en défaut

Le code d’origine fixe l’adresse https://eu2-handy-ghoul-31376.upstash.io dans src/lib/redis.ts. Le résolveur système échoue sur ce domaine. Les résolveurs DNS Google et Cloudflare retournent tous deux Status 3, NXDOMAIN, sans enregistrement A. La connexion HTTPS échoue avant toute authentification.

La page serveur attend sept lectures Redis dans Promise.all, sans délai d’abandon explicite ni état d’erreur. Les logs prouvent le dépassement de dix secondes. L’endpoint qui ne résout plus, combiné à ces attentes, constitue la cause probable fortement étayée du blocage. Aucun log de production plus précis ne montre directement l’erreur DNS, donc ne pas affirmer qu’il le prouve.

## Correction et action restante

La version locale borne réellement les appels Redis à 1,8 seconde, désactive les tentatives automatiques et rend une page explicite en cas d’échec. La collecte des vues se fait en arrière-plan. Les noms historiques des variables restent compatibles, mais le repli sur une adresse disparue ne rétablit pas le service.

Pour restaurer les chiffres, utiliser une base Upstash active et configurer UPSTASH_REDIS_REST_URL avec UPSTASH_REDIS_REST_TOKEN, puis déployer la version corrigée et vérifier une vue et un clic réels. Ne pas simplement augmenter le délai Vercel. Aucune nouvelle base ni aucun déploiement n’a été créé pendant cette intervention.
