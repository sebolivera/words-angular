import Entity from "./entity";

export default class Player extends Entity{
    constructor(public x: number, public y: number, public radius: number, public sprites: Array<string>){
      super('player', x, y, radius, sprites);
    }
    movePlayer(x:number, y:number): void {//will probably add stuff for player specific interactions here
        super.moveEntity(x, y);
    }
  }
  