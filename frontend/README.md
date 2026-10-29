# Map Monde — interface du jeu

Le dossier `frontend` contient les pages intégrées à Vite et le code TypeScript.

## Lancer le jeu

Depuis `Map_Monde_App`, lancer `npm.cmd run dev`. La même commande fonctionne depuis `frontend`.
Ouvrir l’adresse affichée, normalement http://127.0.0.1:5173/.
La page d’accueil est `index.html`. Le bouton Commencer ouvre `jeu.html`.
Arrêter le serveur avec Ctrl + C.

Les dépendances sont déjà installées. Sur une nouvelle installation, lancer `npm.cmd install` dans `frontend`, puis `npm.cmd run dev`.

## Organisation

- `src/main.ts` : formulaire du joueur et navigation vers le jeu.
- `src/game.ts` : parcours, placement, compte à rebours, aides et records.
- `src/types.ts` : types des profils, cartes, pièces et records.
- `src/data/stages.json` : les neuf parcours, les pièces et leurs coordonnées.
- `src/styles/template.css` : style de base du template.
- `src/styles/signin.css` et `src/styles/game.css` : adaptations validées.
- `../images/` : PNG originaux, servis par Vite sans duplication pendant le développement.

## Règles conservées

Le temps total d’une carte est de 15 secondes par pièce. Le compte à rebours démarre au premier déplacement ou à la première aide. Une carte dispose de cinq aides au maximum. À zéro, les placements s’arrêtent et la partie ne peut pas établir de record. Une pièce rapporte 100 points, une aide retire 20 points et une erreur retire 10 points ; le score ne descend pas sous zéro.

Le profil reste dans la session du navigateur. Les records sont enregistrés localement, pour l’adresse utilisée. Les données enregistrées avec Live Server ne sont pas automatiquement accessibles à Vite, car les adresses peuvent être différentes. Aucun serveur de comptes ni base de données n’est requis.

## Préparer une version à publier

Lancer `npm.cmd run build` pour vérifier les types et générer `frontend/dist`, puis `npm.cmd run preview` pour tester cette version à http://127.0.0.1:4173/.
Cette compilation inclut les cartes et leurs crédits. Conserver les attributions des données et du template lors de la diffusion.

Le dossier `Template` est conservé comme référence. Les modifications destinées à la version Vite doivent désormais être faites dans `frontend`. Phaser reste installé ; le moteur de placement validé conserve actuellement son affichage HTML et ses événements de pointeur.


## Records personnels

La page `records.html` affiche le meilleur résultat enregistré pour chaque carte : score, temps, aides et erreurs. Elle est accessible depuis la barre latérale du jeu et la fenêtre de fin de partie. Les filtres permettent de voir toutes les cartes, les cartes terminées ou les cartes à terminer. Le tableau adapte le nombre de lignes à la hauteur disponible ; utiliser Précédent et Suivant pour parcourir les résultats.

Les liens Jouer et Rejouer ouvrent directement la carte choisie. Le retour au jeu depuis les records conserve le parcours sélectionné, mais démarre une nouvelle partie. Une confirmation est affichée avant de quitter une partie en cours pour consulter les records.

Les résultats restent propres à ce navigateur et à cette adresse, même si le nom du joueur change. Il s’agit de records locaux, sans classement en ligne ni historique de toutes les parties. Les résultats incompatibles avec les limites actuelles de temps ou d’aides sont ignorés sans être supprimés du stockage.

- `src/records.ts` et `src/styles/records.css` : page des records.
- `src/record-store.ts` : lecture, validation et sauvegarde partagées avec le jeu.
- `src/rules.ts` : durée par pièce et maximum d’aides.
