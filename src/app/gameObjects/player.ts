import Entity from "./entity";

export default class Player extends Entity{
    constructor(public x: number, public y: number, public size: number, public layerValue:number, public sprites: Array<string>){
      super('player', x, y, size, layerValue, sprites);
    }
    movePlayer(x:number, y:number): void {//will probably add stuff for player specific interactions here
        super.moveEntity(x, y);
    }
  }
  