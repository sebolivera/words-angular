import Entity from './entity';

export default class Letter extends Entity {
  constructor(
    public name: string,
    public x: number = -1,
    public y: number = -1,
    public size: number,
    public layerValue: number,
    public isWalkable: boolean = false,
    public isPushable: boolean = true,
    public sprites: Array<string> = null
  ) {
    super(name, x, y, size, layerValue, isWalkable, isPushable, sprites);
    if (!sprites) {
      let tsprites: Array<string> = [];
      for (let i = 0; i < sprites.length; i++) {
        tsprites.push(sprites[i].replace('/entities/', '/letters/'));
      }
      this.sprites = tsprites;
    }
  }
}
