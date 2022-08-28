import Entity from './entity';

export default class Player extends Entity {
  public selectedInventoryItem: number = -1;
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

  public isInInventory(searchTerm: string): Entity {
    for (let i = this.inventory.length - 1; i >= 0; i--) {
      if (this.inventory[i].name === searchTerm) {
        return this.inventory[i];
      }
    }
    return null;
  }

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
