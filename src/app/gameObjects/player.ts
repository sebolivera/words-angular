import Entity from './entity';

export default class Player extends Entity {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public size: number = 0,
    public layerValue: number = 0,
    public sprites: Array<string> = [],
    public inventory: Array<Entity> = [],
    public maxInventorySize: number = 6 //arbitrary af
  ) {
    super('player', x, y, size, layerValue, false, true, sprites);
    this.inventory = inventory;
    this.maxInventorySize = maxInventorySize;
  }
  public movePlayer = (x: number, y: number): void => {
    //will probably add stuff for player specific interactions here
    super.moveEntity(x, y);
  };
  public addToInventory(entity: Entity): Boolean {
    if (this.inventory.length < this.maxInventorySize) {
      this.inventory.push(entity);
      return true;
    } else {
      return false;
    }
  }
  public removeFromInventory(entity: Entity) {
    this.inventory = this.inventory.filter(
      (item) => JSON.stringify(entity) !== JSON.stringify(item)
    );
  }
}
