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
  public letters: Array<Letter>;
  public entities: Array<Entity>;
  constructor(initObject: any) {
    this.sizeX = initObject.sizeX;
    this.sizeY = initObject.sizeY;
    this.name = initObject.name;
    this.id = initObject.id;
    // this.cellData = initObject.cellData;
    let letters: Array<Letter> = [];
    for (let i = 0; i < initObject.letters.length; i++) {
      letters.push(
        new Letter(
          initObject.letters[i].name, //'name' of the letter
          initObject.letters[i].xPos, //x position
          initObject.letters[i].yPos, //y position
          initObject.letters[i].cellSize, //size of the cell (default is 1 for 1x1 cells, can't be any other shape than square)
          initObject.letters[i].layerValue,
          initObject.letters[i].isWalkable, //is walkable
          initObject.letters[i].isPushable, //is pushable
          [
            'assets/images/letters/' + initObject.letters[i].name + '1.png',
            'assets/images/letters/' + initObject.letters[i].name + '2.png',
            'assets/images/letters/' + initObject.letters[i].name + '3.png',
          ] //frames
        )
      );
    }
    this.letters = letters;

    let tentities: Array<Entity> = [];
    for (let i = 0; i < initObject.entities.length; i++) {
      tentities.push(
        new Entity(
          initObject.entities[i].name, //'name' of the letter
          initObject.entities[i].xPos, //x position
          initObject.entities[i].yPos, //y position
          initObject.entities[i].cellSize, //size of the cell (default is 1 for 1x1 cells, can't be any other shape than square)
          initObject.entities[i].layerValue,
          initObject.entities[i].isWalkable, //is walkable
          initObject.entities[i].isPushable, //is pushable
          [
            'assets/images/entities/' + initObject.entities[i].name + '1.png',
            'assets/images/entities/' + initObject.entities[i].name + '2.png',
            'assets/images/entities/' + initObject.entities[i].name + '3.png',
          ], //frames
          initObject.entities[i].kills,
          initObject.entities[i].additionnalProperties,
          initObject.entities[i]?.ai
        )
      );
    }
    this.entities = tentities;

    let playerSprites: Array<string> = [];
    if (
      !initObject.player.customSprites ||
      initObject.player.customSprites.length < 3
    ) {
      //shouldn't be any by default
      playerSprites = [
        'assets/images/player/player1.png',
        'assets/images/player/player2.png',
        'assets/images/player/player3.png',
      ];
    } else {
      for (let customSprite of initObject.player.customSprites) {
        playerSprites.push('assets/images/player/' + customSprite);
      }
    }
    this.player = new Player(
      initObject.player.xPos,
      initObject.player.yPos,
      initObject.player.size,
      initObject.layerValue,
      playerSprites
    );
  }

  public getWalkableMatrix():Array<Array<Boolean>> {//creates a matrix of cells. Walkable cells are marked as true, non-walkable ones are marked as false

    let matrix: Array<Array<Boolean>> = [];
    for (let i = 0; i<this.sizeY; i++)
    {
      matrix.push(new Array(this.sizeX).fill(true));
    }
    for (let k = 0; k < this.entities.length; k++) {//dont know whether or not this is the most efficient way to do it, but it will do for now
      matrix[this.entities[k].x][this.entities[k].y] = this.entities[k]?.isWalkable;
    }
    return matrix;
  }
  public isWalkableCell(coords:Array<any>):Boolean{
    let x:number = coords[0];
    let y:number = coords[1];
    let blockingEntities = this.entities.filter(e => (e.x===x && e.y===y && !e.isWalkable));//grabs all entities on the cell that aren't walkable
    return blockingEntities.length===0;//if there's at least one entity on the cell, you can't walk on it
  }
  public showData(): void {
    // FOR DEBBUGING PURPOSES ONLY, DELETE IT LATER
    console.log(
      '\n\n\n\n\n============================Level contents============================'
    );
    console.log('>id:', this.id);
    console.log('>name:', this.name);
    console.log('>letters:', this.letters);
    console.log('>entities:', this.entities);
    console.log('>player:', this.player);
    console.log('>sizeX:', this.sizeX);
    console.log('>sizeY:', this.sizeY);
    console.log(
      '============================End level contents============================\n\n\n\n\n'
    );
  }
}
