# Words (EN)


## Description

"Words" is an unfinished game app project I created to (re)teach myself some Ionic, Angular & TypeScript after not using it for years. The set of features is relatively small at the moment, but I will gradually implement more as I go.

**Note**: I know that Angular is a poor choice of language to build a game, but I don't plan on releasing this to any particular platform. Although I added Ionic to try and make it prettier on mobile.


## Setup (desktop browser-only at the moment)

- Install Ionic with `npm install -g @ionic-cli` (you might need to use `sudo` on UNIX, depending on your config).
- Run `npm install` at the root of the project.
- Run `ionic serve` to start the app in browser.
<sub><sub><sub><sub><sub>If you want to play this on your phone or in a phone emulator... Good luck.</sub></sub></sub></sub></sub>

>Note: Node Back-End not yet implemented.

## How to play

- Switch between playing and editing by clicking the button at the top

### Editor mode

- Move the player's position by clicking them. Do note that you cannot delete the player nor add more (yet...).
- Change the grid's size by ajusting the height and width sliders. Be aware that entities that end up outside the level will not get added to it.
- Select entities or letters by clicking their respective menu.
- You can place several of them without having to re-select them
- Save and load levels from local storage or JSON files (backend implementation pending).

### Play mode
- Move the character using the arrow keys.
- Click on inventory items to select them, then click on a cell to use them.
- Push the letters around to form words.
- Reach the 'Win' or 'Goal' tiles.
- (Some) coherent words will make up objects that you can use.
- Some objects can't be pushed.
- Some objects will kill you.
- Some objects can be collected.
- Some mobs will follow you, others might flee.
- Press 'u' to undo.
- Press 'r' to restart the level.
- Once a level is won, press 'n' to go to the next one.
- You can select levels directly by using the side menu.


# Words (FR)


## Description

"Words" est un projet de jeu pas terminé dont je me suis servi pour (ré)apprendre à utiliser Ionic, Angular et TypeScript, après des années sans pratique. Il y a à l'heure actuelle assez peu de fonctionnalités, mais j'en ajouterai au fur et à mesure.

**Note**: Je suis conscient qu'Angular n'est pas le meilleur langage pour coder un jeu vidéo, mais je n'ai pas pour prétention de le publier sur quelconque plateforme. J'ai ajouté Ionic afin de mettre en place une future version mobile.


## Installation (desktop uniquement)

- Installez Ionic avec `npm install -g @ionic-cli` (vous aurez peut-être besoin d'utiliser la commande `sudo` sur les systèmes UNIX)
- Lancez la commande `npm install` à la racine du projet
- Lancez la commande `ionic serve` pour lancer l'app dans un navigateur
<sub><sub><sub><sub><sub>Si vous essayez de lancer ce jeu sur téléphone ou sur un émulateur de téléphone... Bonne chance.</sub></sub></sub></sub></sub>

>Note: il existe un Back-End en Node qui servira au futur enregistrement des niveaux, mais je ne l'ai pas encore implémenté

## Comment jouer

- Cliquez sur le bouton bleu en haut pour basculer de l'éditeur de niveau à la partie jeu. Les autres instructions sont situées dans le bandeau de droite.

### Mode édition

- Déplacez le personnage en cliquant dessus. Veuillez noter que vous ne pouvez pas supprimer ou dupliquer le personnage (pour l'instant...).
- Ajustez la taille de la grille via les sliders 'height' et 'width'. Attention: les entités hors de la grille disparaîtront lorsque vous la réduirez.
- Vous pouvez sélectionner des entités ou des lettres à placer depuis leurs menus respectifs.
- Vous pouvez charger et sauvegarder des niveaux en local sur votre navigateurs, ou en fichiers JSON (la partie Back-End est encore à implémenter).

### Mode jeu

- Utilisez les flèches du clavier pour déplacer le personnage.
- Utilisez la souris pour sélectionner des items dans votre inventaire, puis cliquez sur une case si vous souhaitez déposer ces objets.
- Poussez les lettres pour former des mots (en anglais uniquement).
- Atteignez la case 'Win' ou 'Goal' afin de finir un niveau.
- (Certains) mots vous permettrons de créer des objets utiles.
- Certains objets ne peuvent pas être poussés.
- Certains objets peuvent vous tuer.
- Certains objets peuvent être ramassés.
- Certaines entités vous suivront, d'autres vous fuiront.
- Appuyez sur 'u' pour annuler une action.
- Appuyez sur 'r' pour recommencer un niveau.
- Une fois un niveau fini, appuyez sur 'n' pour passer au suivant.
- Vous pouvez sélectionner un niveau directement en utilisant le menu latéral.