import Entity from './entity';
import Letter from './letter';
import Player from './player';

export default class Level {
  public sizeX: number;
  public sizeY: number;
  public name: string;
  public id: number;
  // public cellData:Array<any>;//I'll figure that one out later
  // public allEntities: Map<string, Entity>;
  public player: Player;
  public letterObjects: Array<Letter>;
  constructor(initObject: any) {
    this.sizeX = initObject.sizeX;
    this.sizeY = initObject.sizeY;
    this.name = initObject.name;
    this.id = initObject.id;
    // this.cellData = initObject.cellData;
    let letterObjects: Array<Letter> = [];
    for (let i = 0; i < initObject.letters.length; i++) {
      letterObjects.push(
        new Letter(
          initObject.letters[i].name, //'name' of the letter
          initObject.letters[i].xPos, //x position
          initObject.letters[i].yPos, //y position
          initObject.letters[i].cellSize, //size of the cell (default is 1 for 1x1 cells, can't be any other shape than square)
          initObject.letters[i].layerValue,
          [
            'assets/images/' + initObject.letters[i] + '1.png',
            'assets/images/' + initObject.letters[i] + '2.png',
            'assets/images/' + initObject.letters[i] + '3.png',
          ], //frames
          true //is walkable
        )
      );
    }
    this.letterObjects = letterObjects;
    let playerSprites: Array<string>;
    if (
      !initObject.player.customSprites ||
      initObject.player.customSprites.length < 3
    ) {
      //shouldn't be any by default
      playerSprites = [
        'assets/images/player1.png',
        'assets/images/player2.png',
        'assets/images/player3.png',
      ];
    } else {
      playerSprites = initObject.player.customSprites;
    }
    this.player = new Player(
      initObject.player.xPos,
      initObject.player.yPos,
      initObject.player.size,
      initObject.layerValue,
      playerSprites
    );
  }

  public showData(): void {
    // FOR DEBBUGING PURPOSES ONLY, DELETE IT LATER
    console.log('id:', this.id);
    console.log('name:', this.name);
    console.log('letterObjects:', this.letterObjects);
    console.log('player:', this.player);
    console.log('sizeX:', this.sizeX);
    console.log('sizeY:', this.sizeY);
  }
}
