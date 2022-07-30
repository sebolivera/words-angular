export default class Level {
  constructor(
    public name: string,
    public sizeX: number = 50,
    public sizeY: number = 50,
    public contentStartState: JSON
  ) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.name = name;
    import('../levels/' + name + '.ts').then((obj) => {
      this.contentStartState = obj;//check later whether that works or not
    });
  }
}
