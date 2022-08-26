import Entity from './entity';

export default class Collectible extends Entity {
  constructor(
    public name: string = '',
    public x: number = -1,
    public y: number = -1,
    public size: number = 0,
    public layerValue: number = -1,
    public isWalkable: boolean = true,
    public isPushable: boolean = true,
    public sprites: Array<string> = [],
    public additionnalProperties: Map<string, any> = undefined,
    public isCollectible: boolean = true
  ) {
    let tsprites: Array<string> = [];
    if (sprites.length > 0) {
      for (let i = 0; i < sprites.length; i++) {
        tsprites.push(sprites[i]);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        tsprites.push(
          'assets/images/entities/' + name.toLowerCase() + i + '.png'
        );
      }
    }
    super(name, x, y, size, layerValue, isWalkable, isPushable, tsprites);
    this.sprites = tsprites;
    this.isCollectible = isCollectible;
  }
}
