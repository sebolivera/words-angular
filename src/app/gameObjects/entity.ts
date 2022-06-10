export default class Entity{
    public frame: number;
    constructor(public name: string, public x: number=-1, public y: number=-1, public radius: number, public sprites: Array<string>){
      this.x = x;
      this.y = y;
      this.name = name;
      this.radius = radius;
      this.sprites = sprites;
      this.frame = 0;
    }
    public moveEntity(x:number, y:number): void {
        this.x = x;
        this.y = y;
    }

    public getFrame(frame: number): string {
        return this.sprites[frame];
    }

    public updateFrame(): void {
        this.frame = (this.frame+1)%this.sprites.length;
    }

  }
  