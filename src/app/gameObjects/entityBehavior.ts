import { pathFinderAStar } from '../misc/utils';
import Entity from './entity';
import Level from './level';
import behaviorList from '../misc/entityBehaviorMap.json';

export default class EntityBehavior {
  public moves: Boolean = false;
  constructor(
    public name: string,
    public canFly: boolean = false,
    public canSwim: boolean = false
  ) {
    this.name = name;
    this.canFly = canFly;
    this.canSwim = canSwim;
    if (behaviorList.behaviors.moving.includes(this.name)) {
      this.moves = true;
    }
  }

  public getNextPos(
    entity: Entity,
    levelData: Level
  ): [[number, number], number] {
    //returns a set of coordinates, as well as a new layerValue
    let newX: number;
    let newY: number;
    let walkableCellsMatrix: Array<Array<Boolean>> =
      levelData.getWalkableMatrix();
    switch (this.name) {
      case 'fleeing':
        break;
      case 'roaming':
        break;
      case 'seeking':
        const path:Array<[number, number]> = pathFinderAStar(
          [entity.x, entity.y],
          [levelData.player.x, levelData.player.y],
          walkableCellsMatrix
        ).reverse();
        const [movedToX, movedToY]:[number, number] = path.length>0?path[0]:[null, null];
        if (!movedToX || !movedToY)
        {
          newX = entity.x;
          newY = entity.y;
        }
        else
        {
          newX=movedToX;
          newY=movedToY;
        }
      case 'dead':
      case 'inert':
      default:
        break;
    }
    if (this.canFly) {
      return [[newX, newY], entity.layerValue];
    } else {
      //everything that can't fly falls, so the layerValue gets set to 0
      return [[newX, newY], 0];
    }
  }
}
