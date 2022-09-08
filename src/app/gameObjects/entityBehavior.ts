import { pathFinderAStar, getRandomInt, clamp, heuristic } from '../misc/utils';
import Entity from './entity';
import Level from './level';
import behaviorList from '../../assets/entityData/entityBehaviorMap.json';

export default class EntityBehavior {
  public moves: Boolean = false;
  constructor(
    public name: string,
    public canFly: boolean = false,
  ) {
    this.name = name;
    this.canFly = canFly;
    if (behaviorList.behaviors.moving.includes(this.name)) {
      this.moves = true;
    }
  }

  public getNextPos(
    entity: Entity,
    levelData: Level,
    targetCoords:[number, number]
  ): [[number, number], number] {
    //returns a set of coordinates, as well as a new layerValue
    let newX: number;
    let newY: number;
    let walkableCellsMatrix: Array<Array<Boolean>> =
      levelData.getWalkableMatrix();
    let path: Array<[number, number]>;
    let [movedToX, movedToY]: [number, number] = [entity.x, entity.y];
    let [px, py, ex, ey, sx, sy]: number[] = [
      levelData.player.x,
      levelData.player.y,
      entity.x,
      entity.y,
      levelData.sizeX - 1,
      levelData.sizeY - 1,
    ];
    switch (this.name) {//temporary solution for the "fleeing behavior"
      case 'fleeing':
        console.log('Rat?', entity.name)
        let [targetX, targetY]: [number, number] = [0, 0];
        let [addX, addY]: number[] = [0, 0];
        if (px < ex) {
          //if the player is LEFT of the mob
          if (ex + (ex - px) < sx) {
            targetX = Math.min(ex + (ex - px), sx);
          } else {
            //if the enemy is reaching the right border
            targetX = sx;
            if (ey === sy / 2) {
              //if the enemy is right in the middle of the y axis, it has a one out of two chances to go up or down
              if (ey - py === 0 && getRandomInt(2) === 1) {
                //if the enemy and the player are on the same line while the enemy sticks to the wall, it has a one out of two chances to flee upwards, and the other to flee downwards for as many cells as the enemy is far, but transposed to the other axis
                addY -= Math.abs(ex - (px - ex));
              } else {
                addY += Math.abs(ex - (px - ex));
              }
            } else if (ey < sy / 2) {
              //if the enemy is lower than the middle, it goes left
              addY -= Math.abs(ex - (px - ex));
            } else {
              addY += Math.abs(ex - (px - ex));
            }
          }
        } else {
          //if the player is to the RIGHT of the mob
          if (ex - (px - ex) < 0) {
            //if the fleeing enemy is fleeing towards the outside of the border, it flees to one of the sides
            targetX = 0; //it stays close to the wall
            if (ey - py === 0 && getRandomInt(2) === 1) {
              //if the enemy and the player are on the same line while the enemy sticks to the wall, it has a one out of two chances to flee upwards, and the other to flee downwards for as many cells as the enemy is far, but transposed to the other axis
              addY -= Math.abs(ex - (px - ex));
            } else {
              addY += Math.abs(ex - (px - ex));
            }
          } else if (ey < sy / 2) {
            targetX = ex - (px - ex);
            //if the enemy is lower than the middle, it goes left
            addY -= Math.abs(ex - (px - ex));
          } else {
            addY += Math.abs(ex - (px - ex));
          }
        }

        if (py < ey) {
          if (ey + (ey - py) < sy) {
            targetY = Math.min(ey + (ey - py), sy);
          } else {
            targetY = sy;
            if (ex === sx / 2) {
              if (ex - px === 0 && getRandomInt(2) === 1) {
                addX -= Math.abs(ey - (py - ey));
              } else {
                addX += Math.abs(ey - (py - ey));
              }
            } else if (ex < sx / 2) {
              addX -= Math.abs(ey - (py - ey));
            } else {
              addX += Math.abs(ey - (py - ey));
            }
          }
        } else {
          if (ey - (py - ey) < 0) {
            targetY = 0;
            if (ex - px === 0 && getRandomInt(2) === 1) {
              addX -= Math.abs(ey - (py - ey));
            } else {
              addX += Math.abs(ey - (py - ey));
            }
          } else if (ex < sx / 2) {
            targetY = ey - (py - ey);
            addX -= Math.abs(ey - (py - ey));
          } else {
            addX += Math.abs(ey - (py - ey));
          }
        }

        targetX += addX;
        targetX = clamp(targetX, 0, sx);
        targetY += addY;
        targetY = clamp(targetY, 0, sy);

        path = pathFinderAStar(
          [entity.x, entity.y],
          [targetX, targetY],
          walkableCellsMatrix
        ).reverse();
        [movedToX, movedToY] = path.length > 0 ? path[0] : [null, null];

        if (movedToX===null || movedToY===null) {
          newX = entity.x;
          newY = entity.y;
        } else {
          newX = movedToX;
          newY = movedToY;
        }
        break;
      case 'roaming':
        break;
      case 'seeking':
        if (heuristic([entity.x, entity.y], targetCoords))
        path = pathFinderAStar(
          [entity.x, entity.y],
          targetCoords,
          walkableCellsMatrix,
          entity?.additionalProperties['canWalkDiagonnally']
        ).reverse();
        [movedToX, movedToY] = path && path.length > 0 ? path[0] : [null, null];
        if (movedToX===null || movedToY===null) {//WHY IS 0 FALSY FFS
          newX = entity.x;
          newY = entity.y;
        } else {
          newX = movedToX;
          newY = movedToY;
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
