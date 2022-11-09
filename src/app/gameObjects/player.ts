import Entity from './entity';

export default class Player extends Entity {
  public playerIsInVehicle: Entity = null;
  public selectedInventoryItem: number = -1; //arguably the worst possible way to keep tabs on which item is currently selected in the inventory (as it forces me to check for inventory size), but since I already implemented it I'm going to pretend that it's more efficient
  constructor(
    public x: number = 0,//xpos
    public y: number = 0,//ypos
    public size: number = 1,//cellsize, not really used atm but might in the future
    public layerValue: number = 0,//future implementation for flight ability. 0 = ground, 1 = higher
    public sprites: Array<string> = [],//for custom sprites mostly
    public inventory: Array<Entity> = [],//contains a direct reference to entities held by the player. They have the same structure as stuff that is placed within the grid
    public maxInventorySize: number = 6 //arbitrary
  ) {
    super('player', x, y, size, layerValue, false, true, sprites);
    this.inventory = inventory;//this and the part below aren't needed. No idea why I did it that way.
    this.maxInventorySize = maxInventorySize;
  }
  public movePlayer = (x: number, y: number): void => {
    //will probably add stuff for player specific interactions here (ex: movement buffs and status effects)
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
  public JSONSerialize(): Record<string, any> {
    //i know this overlaps with the entity export but I didn't plan ahead and I'm too lazy to fix it
    let finalJSON: Record<string, any> = {};
    finalJSON['xPos'] = this.x;
    finalJSON['yPos'] = this.y;
    finalJSON['size'] = this.size;
    finalJSON['layerValue'] = this.layerValue;
    return finalJSON;
  }
}
