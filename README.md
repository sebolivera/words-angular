# Words

## Description

"Words" is an unfinished game app project I created to (re)teach myself some Ionic, Angualr & TypeScript after not using it for years. The set of features is relatively small at the moment, but I will gradually implement more as I go.

**Note**: I know that Angular is a poor choice of language to build a game, but I don't plan on releasing this to any particular platform. Although I added Ionic to try and make it prettier on other platforms.


## Setup (for browser display)

- Install ionic with `npm install -g @ionic-cli` (you might need to use `sudo`, depending on your config)
- Run `npm install` at the root of the project
- Run `ionic serve` to start the app in browser
- Click the blue button on top to switch between the level editor and the gameplay part. Instructions on the right
<sub><sub><sub><sub><sub>If you want to play this on your phone or in a phone emulator... Good luck.</sub></sub></sub></sub></sub>

>Note: Node backend not yet implemented.

## How to play

- Move the character using the arrow keys
- Push the letters around to form words
- Reach the 'Win' or 'Goal' tiles
- (Some) coherent words will make up objects that you can use
- Some objects can't be pushed
- Some objects will kill you
- Some objects can be picked up
- Some mobs will follow you, others might flee
- Press 'u' to undo
- Press 'r' to restart the level
- Once a level is won, press 'n' to go to the next one