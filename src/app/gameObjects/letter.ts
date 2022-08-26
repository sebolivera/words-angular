import Entity from './entity';

export default class Letter extends Entity {
  constructor(
    public name: string = '',
    public x: number = -1,
    public y: number = -1,
    public size: number = 0,
    public layerValue: number = -1,
    public isWalkable: boolean = false,
    public isPushable: boolean = true,
    public sprites: Array<string> = []
  ) {
    super(name, x, y, size, layerValue, isWalkable, isPushable, sprites);
  }
  public updateSprites(): void {
    for (let i = 0; i < this.sprites.length; i++) {
      if (this.sprites[this.sprites[i].length - 6] === '/') {
        this.sprites[i] = 'assets/images/letters/' + this.name + '.png';
      }
    }
  }
}
