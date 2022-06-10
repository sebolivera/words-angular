export default class Player{
    constructor(public x: number, public y: number, public radius: number, public color: string){
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
    }
    movePlayer(x:number, y:number): void {
        this.x = x;
        this.y = y;
    }
  }
  