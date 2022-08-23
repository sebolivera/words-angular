import EntityBehavior from './entityBehavior';
import behaviorList from '../misc/entityBehaviorMap.json';
import Level from './level';
export default class Entity {
  public frame: number;
  public active: boolean = true;
  public ai: EntityBehavior;
  constructor(
    public name: string,
    public x: number = -1,
    public y: number = -1,
    public size: number,
    public layerValue: number = 0,
    public isWalkable: Boolean = false,
    public isPushable: Boolean = true,
    public sprites: Array<string> = null,
    public kills: Boolean = false,
    public additionnalProperties: Map<string, any> = undefined,
    ai: string = undefined
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
    this.kills = kills;
    this.additionnalProperties = additionnalProperties;
    if (
      !ai ||
      ai.length === 0 ||
      (!behaviorList.behaviors.moving.includes(ai) &&
        !behaviorList.behaviors.immobile.includes(ai))
    ) {
      if (ai)
        console.info(
          `Behavior '${ai}' was not included in [${behaviorList.behaviors.moving.join(
            ', '
          )}] or [${behaviorList.behaviors.immobile.join(', ')}]`
        );
      this.ai = new EntityBehavior('inert');
    } else {
      this.ai = new EntityBehavior(ai);
    }
  }
  public moveEntityTo(coords: Array<any>): void {
    //absolutely useless decorator bc not sure how to implement union type in this use case
    this.moveEntity(coords[0], coords[1]);
    this.layerValue = coords[2];
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

  public setAll(setObj: any): void {
    for (let key of Object.keys(setObj)) {
      this[key] = setObj[key]; //I'm guessing I did that to manage some kind of shallow copy problem...? Tbh I forgot and it works well enough.
    }
  }
  public aiMove(levelData: Level): void {
    if (this.ai.moves) {
      if (this.ai.getNextPos(this, levelData) && levelData.isWalkableCell(this.ai.getNextPos(this, levelData)[0])) {
        this.moveEntityTo(this.ai.getNextPos(this, levelData)[0]);
      }
    }
  }
}
