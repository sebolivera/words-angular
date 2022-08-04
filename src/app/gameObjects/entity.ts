export default class Entity {
  public frame: number;
  public active: boolean = true;
  constructor(
    public name: string,
    public x: number = -1,
    public y: number = -1,
    public size: number,
    public layerValue: number = 0,
    public isWalkable: Boolean = false,
    public isPushable: Boolean = true,
    public sprites: Array<string> = null
  ) {
    this.x = x;
    this.y = y;
    this.name = name;
    this.size = size;
    this.layerValue = layerValue;
    if (sprites) {
      this.sprites = sprites;
    } else {
      let tsprites = [];
      for (let i = 1; i <= 3; i++) {
        tsprites.push(
          'assets/images/entities/' + name.toLowerCase() + i + '.png'
        );
      }
      this.sprites = tsprites;
    }

    this.frame = 0;
    //this.frame = Math.floor(Math.random() * 2 + 1);//For randomized animation effects. Looks weird, so I disabled it.
    this.isWalkable = isWalkable;
  }
  public moveEntity(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public getFrame(frame: number): string {
    return this.sprites[frame];
  }

  public updateFrame(): void {
    this.frame = (this.frame + 1) % this.sprites.length;
  }

  public setAll(setObj: any) {
    for (let key of Object.keys(setObj)) {
      switch (key) {
        case 'name':
          this.name = setObj.name;
          break;
        case 'x':
          this.x = setObj.x;
          break;
        case 'y':
          this.y = setObj.y;
          break;
        case 'size':
          this.size = setObj.size;
          break;
        case 'isWalkable':
          this.isWalkable = setObj.isWalkable;
          break;
        case 'isPushable':
          this.isPushable = setObj.isPushable;
          break;
        case 'layerValue':
          this.layerValue = setObj.layerValue;
          break;
        case 'active':
          this.active = setObj.active;
          break;
        default:
          break;
      }
    }
  }
}
