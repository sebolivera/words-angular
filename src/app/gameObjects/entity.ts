import EntityBehavior from './entityBehavior';
import behaviorList from '../../assets/entityData/entityBehaviorMap.json';
import recordedEntities from '../../assets/entityData/entities.json';
import Level from './level';
import { heuristic } from '../misc/utils';
export default class Entity {
  //desc etc are only pulled from the recorded entity
  public verboseName: string;
  public description: string;
  public frame: number = 0;
  public aiBehavior: EntityBehavior = null;
  public playerIsIn: Boolean = false;
  constructor(
    public name: string = '',
    public x: number = -1,
    public y: number = -1,
    public size: number,
    public layerValue: number = 0,
    public isWalkable: Boolean = false,
    public isPushable: Boolean = true,
    public sprites: Array<string> = [],
    public kills: Boolean = false,
    public additionalProperties: Map<string, any> = undefined,
    public ai: string = undefined,
    public isCollectible: boolean = false,
    public active: boolean = true
  ) {
    this.description = '';
    this.verboseName = '';
    let entityParams: Record<string, any> = null;
    for (let types of Object.keys(recordedEntities)) {
      for (let e of Object.keys(recordedEntities[types])) {
        if (e === this.name) {
          entityParams = recordedEntities[types][e];
          break;
        }
      }
    }
    if (entityParams) {
      this.description = entityParams.description;
      this.verboseName = entityParams.verboseName;
    }
    this.x = x;
    this.y = y;
    this.name = name;
    if (size) this.size = size;
    else this.size = 1;
    if (layerValue) this.layerValue = layerValue;
    else this.layerValue = 1;
    if (sprites && sprites !== null && sprites.length > 2) {
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
    this.isWalkable = isWalkable;
    this.kills = kills;
    this.additionalProperties = additionalProperties;
    if (
      !ai ||
      ai === undefined ||
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
      this.aiBehavior = new EntityBehavior('inert');
    } else {
      this.aiBehavior = new EntityBehavior(ai);
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
      if (key === 'ai') {
        //apparently AI stops working after state revert...? Even when it was properly bound.
        if (
          !setObj[key].name ||
          setObj[key].name.length === 0 ||
          (!behaviorList.behaviors.moving.includes(setObj[key].name) &&
            !behaviorList.behaviors.immobile.includes(setObj[key].name))
        ) {
          this.aiBehavior = new EntityBehavior('inert');
        } else {
          this.aiBehavior = new EntityBehavior(setObj[key].name);
        }
      } else {
        this[key] = setObj[key];
      }
    }
  }
  public aiMove(levelData: Level): void {
    if (this.aiBehavior.moves) {
      let minHeuristic: number = levelData.sizeX + levelData.sizeY; //unreachable
      let targetPos: [number, number] = [this.x, this.y];
      for (let entity of levelData.entitiesAndPlayer()) {
        console.log(entity);
        if (
          (this.ai === 'seeking' &&
            this.additionalProperties &&
            this.additionalProperties['seeks'] &&
            this.additionalProperties['seeks'].includes(entity.name)) ||
          (this.additionalProperties['seeks'] && this.additionalProperties['seeks'].includes('food') &&
            this.additionalProperties['food'])
        ) {
          if (
            !this.additionalProperties['seekRadius'] ||
            (heuristic([entity.x, entity.y], [this.x, this.y]) <
              this.additionalProperties['seekRadius'] &&
              !(this.x === entity.x && this.y === entity.y) &&
              this.aiBehavior.getNextPos(this, levelData, [
                entity.x,
                entity.y,
              ]) &&
              levelData.isWalkableCell(
                this.aiBehavior.getNextPos(this, levelData, [
                  entity.x,
                  entity.y,
                ])
              ))
          ) {
            //nightmarish, but basically: if current entity is 'seeking', it seeks entities recorded in its list. If it doesn't have a range, it seeks them no matter what
            if (
              heuristic([entity.x, entity.y], [this.x, this.y]) < minHeuristic
            ) {
              minHeuristic = heuristic([entity.x, entity.y], [this.x, this.y]);
              targetPos = [entity.x, entity.y];
            }
          }
        }
      }
      this.moveEntityTo(
        this.aiBehavior.getNextPos(this, levelData, targetPos)[0]
      );
      //entity death check
      let entityCopy: Array<Entity> = levelData.entities;
      for (let entity of entityCopy) {
        if (
          this !== entity &&
          entity.additionalProperties &&
          entity.additionalProperties['canDie'] &&
          entity.x === this.x &&
          entity.y === this.y &&
          this.kills
        ) {
          levelData.removeFromLevel(entity);
          if (this.additionalProperties) {
            this.additionalProperties['seeks'] = [];
          }
        }
      }

      // if (
      //   !this.additionalProperties['seeks'] ||
      //   levelData.isWalkableCell(
      //     this.aiBehavior.getNextPos(this, levelData, [
      //       levelData.player.x,
      //       levelData.player.y,
      //     ])
      //   )
      // ) {
      //   //safety but, if the entity doesn't have a specific 'seek list', it follows the player by default
      //   this.moveEntityTo(
      //     this.aiBehavior.getNextPos(this, levelData, [
      //       levelData.player.x,
      //       levelData.player.y,
      //     ])[0]
      //   );
      // }
    }
  }
  public exportAsJSON(): Record<string, any> {
    let finalJSON: Record<string, any> = {};
    finalJSON['name'] = this.name;
    finalJSON['xPos'] = this.x;
    finalJSON['yPos'] = this.y;
    finalJSON['size'] = this.size;
    finalJSON['layerValue'] = this.layerValue;
    finalJSON['isWalkable'] = this.isWalkable;
    finalJSON['isPushable'] = this.isPushable;
    if (finalJSON['isCollectible']) {
      finalJSON['isCollectible'] = this.isCollectible;
    }
    finalJSON['kills'] = this.kills;
    finalJSON['additionalProperties'] = this.additionalProperties;
    return finalJSON;
  }
}
