import Entity from './entity';
import Letter from './letter';
import Player from './player';
import recordedEntities from '../../assets/entityData/entities.json';
import { getRandomArbitrary } from '../misc/utils';

export default class Level {
  public sizeX: number;
  public sizeY: number;
  public name: string;
  public description: string = '';
  public id: number;
  public player: Player;
  public letters: Array<Letter>;
  public entities: Array<Entity>;
  public debug: Boolean;
  public levelHistory: Array<Record<string, any>> = [];
  public won: Boolean = false;
  constructor(initObject: any) {
    this.sizeX = initObject.sizeX;
    this.sizeY = initObject.sizeY;
    this.name = initObject.name;
    this.id = initObject.id;
    this.debug = initObject.debug ? initObject.debug : false;
    // this.cellData = initObject.cellData;
    let letters: Array<Letter> = [];
    for (let i = 0; i < initObject.letters.length; i++) {
      let letter: Letter = new Letter(
        initObject.letters[i].name, //'name' of the letter
        initObject.letters[i].xPos, //x position
        initObject.letters[i].yPos, //y position
        initObject.letters[i].cellSize, //size of the cell (default is 1 for 1x1 cells, can't be any other shape than square)
        initObject.letters[i].layerValue,
        initObject.letters[i].isWalkable, //is walkable
        initObject.letters[i].isPushable, //is pushable
        [
          'assets/images/letters/' + initObject.letters[i].name + '1.png',
          'assets/images/letters/' + initObject.letters[i].name + '2.png',
          'assets/images/letters/' + initObject.letters[i].name + '3.png',
        ] //frames
      );
      letters.push(letter);
    }
    this.letters = letters;

    let tentities: Array<Entity> = [];
    for (let i = 0; i < initObject.entities.length; i++) {
      tentities.push(
        new Entity(
          initObject.entities[i].name, //'name' of the letter
          initObject.entities[i].xPos, //x position
          initObject.entities[i].yPos, //y position
          initObject.entities[i].cellSize, //size of the cell (default is 1 for 1x1 cells, can't be any other shape than square)
          initObject.entities[i].layerValue,
          initObject.entities[i].isWalkable, //is walkable
          initObject.entities[i].isPushable, //is pushable
          [
            'assets/images/entities/' + initObject.entities[i].name + '1.png',
            'assets/images/entities/' + initObject.entities[i].name + '2.png',
            'assets/images/entities/' + initObject.entities[i].name + '3.png',
          ], //frames
          initObject.entities[i]?.kills,
          initObject.entities[i].additionalProperties,
          initObject.entities[i]?.ai,
          initObject.isCollectible
        )
      );
    }
    this.entities = tentities;

    let playerSprites: Array<string> = [];
    if (
      !initObject.player.customSprites ||
      initObject.player.customSprites.length < 3
    ) {
      //shouldn't be any by default
      playerSprites = [
        'assets/images/player/player1.png',
        'assets/images/player/player2.png',
        'assets/images/player/player3.png',
      ];
    } else {
      for (let customSprite of initObject.player.customSprites) {
        playerSprites.push('assets/images/player/' + customSprite);
      }
    }
    if (initObject.player) {
      this.player = new Player(
        initObject.player.xPos,
        initObject.player.yPos,
        initObject.player.size,
        initObject.layerValue,
        playerSprites
      );
    } else {
      this.player = new Player(
        Math.floor(this.sizeX / 2),
        Math.floor(this.sizeY / 2),
        1,
        0,
        playerSprites
      );
    }
  }

  private letterGrid = (): Array<Array<Letter>> => {
    let letterGrid: Array<Array<Letter>> = [];
    for (let i = 0; i < this.sizeX; i++) {
      let row: Array<any> = [];
      for (let j = 0; j < this.sizeY; j++) {
        row.push(null);
      }
      letterGrid.push(row);
    }
    this.letters.forEach((e) => {
      if (e instanceof Letter) {
        //old check, not in use anymore, but might use it in the future
        letterGrid[e.x][e.y] = e;
      }
    });
    return letterGrid;
  };

  public checkPlayerDeath = (): Boolean => {
    return (
      this.entities.filter(
        (e) =>
          e.x === this.player.x &&
          e.y === this.player.y &&
          (e.kills ||
            (e.additionalProperties &&
              e['additionalProperties']['absoluteDeath']))
      ).length > 0
    );
  };

  public canCollect = (): Boolean => {
    return (
      this.entities.filter(
        (e) =>
          e.x === this.player.x && e.y === this.player.y && e['isCollectible']
      ).length > 0
    );
  };

  public collect = (x: number, y: number): Array<Entity> => {
    let collectiblesFound: Array<Entity> = [];
    this.entities.forEach((e) => {
      if (e.x === x && e.y === y && e.isCollectible) {
        collectiblesFound.push(e);
      }
    });
    return collectiblesFound;
  };
  private clone<T>(instance: T): T {
    const copy = new (instance.constructor as { new (): T })();
    Object.assign(copy, instance);
    return copy;
  }

  public addToHistory(): void {
    let clonedEntities: Array<Entity> = [];
    for (let entity of this.entities) {
      clonedEntities.push(this.clone(entity));
    }
    let clonedLetters: Array<Letter> = [];

    for (let letter of this.letters) {
      clonedLetters.push(this.clone(letter));
    }
    this.levelHistory.push({
      sizeX: this.sizeX,
      sizeY: this.sizeY,
      name: this.name,
      id: this.id,
      player: {
        x: this.player.x,
        y: this.player.y,
        size: this.player.size,
        layerValue: this.player.layerValue,
        sprites: this.player.sprites,
        inventory: [...this.player.inventory],
        maxInventorySize: this.player.maxInventorySize,
        playerIsInVehicle: this.player.playerIsInVehicle,
      },
      entities: clonedEntities,
      letters: clonedLetters,
      debug: this.debug,
    });
  }

  public undo(): void {
    if (this.levelHistory.length > 0) {
      this.sizeX = this.levelHistory[this.levelHistory.length - 1].sizeX;
      this.sizeY = this.levelHistory[this.levelHistory.length - 1].sizeY;
      this.name = this.levelHistory[this.levelHistory.length - 1].name;
      this.description =
        this.levelHistory[this.levelHistory.length - 1].description;
      this.id = this.levelHistory[this.levelHistory.length - 1].id;
      let vehicle: Entity = null;
      for (let [pKey, pValue] of Object.entries(
        this.levelHistory[this.levelHistory.length - 1].player
      )) {
        if (pKey === 'playerIsInVehicle') {
          vehicle = pValue as Entity;
        }
        this.player[pKey] = pValue;
      }
      this.letters = this.levelHistory[this.levelHistory.length - 1].letters;
      if (vehicle) {
        let tEntities: Array<Entity> = [];
        for (let entities of this.levelHistory[this.levelHistory.length - 1]
          .entities) {
          if (
            entities.playerIsIn
          ) {
            vehicle.x = this.player.x;
            vehicle.y = this.player.y;
            tEntities.push(vehicle);
          } else {
            tEntities.push(entities);
          }
        }
        this.entities = tEntities;
      } else {
        this.entities =
          this.levelHistory[this.levelHistory.length - 1].entities;
      }
      this.debug = this.levelHistory[this.levelHistory.length - 1].debug;
      this.levelHistory.pop();
    }
  }

  public getWalkableMatrix(): Array<Array<Boolean>> {
    //creates a matrix of cells. Walkable cells are marked as true, non-walkable ones are marked as false

    let matrix: Array<Array<Boolean>> = [];
    for (let i = 0; i < this.sizeX; i++) {
      matrix.push(new Array(this.sizeY).fill(true));
    }
    for (let k = 0; k < this.entities.length; k++) {
      //dont know whether or not this is the most efficient way to do it, but it will do for now
      matrix[this.entities[k].x][this.entities[k].y] =
        this.entities[k]?.isWalkable;
    }
    return matrix;
  }
  public isWalkableCell(coords: Array<any>): Boolean {
    let x: number = coords[0];
    let y: number = coords[1];
    let blockingEntities = this.entities.filter(
      (e) => e.x === x && e.y === y && !e.isWalkable
    ); //grabs all entities on the cell that aren't walkable
    return blockingEntities.length === 0; //if there's at least one entity on the cell, you can't walk on it
  }
  public entitiesMinusPlayer(): Array<Entity> {
    return this.entities.concat(this.letters);
  }
  public entitiesAndPlayer(): Array<Entity> {
    return this.entities.concat(this.letters).concat([this.player]);
  }

  public pushNextEntity(vector: [number, number], entity: Entity): Boolean {
    for (let e of this.entitiesMinusPlayer()) {
      //grabs all entities
      if (entity.x + vector[0] === e.x && entity.y + vector[1] === e.y) {
        //gets the entity (if there is one) on the place of where the current entity was pushed
        if (e.isPushable && this.pushNextEntity(vector, e)) {
          if (
            entity.x + vector[0] >= this.sizeX ||
            entity.y + vector[1] >= this.sizeY
          ) {
            return false;
          }
          entity.x += vector[0];
          entity.y += vector[1];
          return true;
        } else if (
          entity.additionalProperties &&
          entity.additionalProperties['canSwim'] &&
          e.additionalProperties &&
          e.additionalProperties['isSwimeable']
        ) {
          entity.x += vector[0];
          entity.y += vector[1];
          return true;
        } else {
          return false;
        }
      }
    }
    if (
      entity.x + vector[0] >= this.sizeX ||
      entity.y + vector[1] >= this.sizeY
    ) {
      return false;
    }
    entity.x += vector[0];
    entity.y += vector[1];
    return true;
  }

  public foundWords = (): [
    Array<string>,
    Array<Array<Record<string, [number, number]>>>
  ] => {
    let foundWords: Array<Array<Record<string, [number, number]>>> = [];
    let foundWordsStr: Array<string> = [];
    let letterGrid: Array<Array<Letter>> = this.letterGrid();
    let currentReadWordHoz: Array<Letter> = [];
    let currentReadWordVert: Array<Letter> = [];
    let entityList: Array<string> = [];

    for (let types of Object.keys(recordedEntities)) {
      if (
        ['obstacles', 'mobs', 'collectibles', 'other', 'vehicles'].includes(
          types
        )
      ) {
        //not needed atm but will help if I add custom types
        for (let obj of Object.keys(recordedEntities[types])) {
          entityList.push(obj);
        }
      }
    }
    horizontalReading: for (let i = 0; i < this.sizeY; i++) {
      for (let j = 0; j < this.sizeX; j++) {
        currentReadWordHoz = [];
        if (
          letterGrid &&
          letterGrid.length > 0 &&
          letterGrid[i] &&
          letterGrid[i][j]
        ) {
          let ii = i;
          while (ii < this.sizeX && letterGrid[ii][j] instanceof Letter) {
            currentReadWordHoz.push(letterGrid[ii][j]);
            ii++;
          }
          for (let k = currentReadWordHoz.length; k > 1; k--) {
            let word: string = currentReadWordHoz
              .slice(0, k)
              .map((e) => e.name)
              .join('');
            if (entityList.includes(word)) {
              foundWords.push([]);
              for (let n = 0; n < word.length; n++) {
                let letter: string = word[n];
                foundWords[foundWords.length - 1].push({
                  [letter]: [currentReadWordHoz[n].x, currentReadWordHoz[n].y],
                });
              }
              foundWordsStr.push(word);
              break horizontalReading; //I KNEW I was going to be using one of these
            }
          }
        }
      }
    }
    verticalReading: for (let j = 0; j < this.sizeX; j++) {
      for (let i = 0; i < this.sizeY; i++) {
        currentReadWordVert = [];
        if (
          letterGrid &&
          letterGrid.length > 0 &&
          letterGrid[i] &&
          letterGrid[i][j]
        ) {
          let jj = j;
          while (jj < this.sizeY && letterGrid[i][jj] instanceof Letter) {
            currentReadWordVert.push(letterGrid[i][jj]);
            jj++;
          }
          for (let k = currentReadWordVert.length; k > 1; k--) {
            let word: string = currentReadWordVert
              .slice(0, k)
              .map((e) => e.name)
              .join('');
            if (entityList.includes(word)) {
              foundWords.push([]);
              for (let n = 0; n < word.length; n++) {
                let letter: string = word[n];
                if (
                  foundWords.filter(
                    (e) =>
                      Object.keys(e)[0] === letter &&
                      e[Object.keys(e)[0]][0] === currentReadWordVert[n].x &&
                      e[Object.keys(e)[0]][1] === currentReadWordVert[n].y
                  ).length === 0
                )
                  foundWords[foundWords.length - 1].unshift({
                    [letter]: [
                      currentReadWordVert[n].x,
                      currentReadWordVert[n].y,
                    ],
                  });
              }
              foundWordsStr.push(word);
              break verticalReading;
            }
          }
        }
      }
    }
    return [foundWordsStr, foundWords];
  };

  public removeFromLevel(entity: Entity): void {
    let tempLevelEntities: Array<Entity> = [];
    for (let e of this.entities) {
      //will not work for letters
      if (JSON.stringify(entity) !== JSON.stringify(e)) {
        tempLevelEntities.push(e);
      }
    }
    this.entities = tempLevelEntities;
  }

  public movePlayer(x: number, y: number): void {
    let walkable: Boolean = true;
    let collectibles: Array<Entity> = [];
    if (x < this.sizeX && y < this.sizeY) {
      for (let entity of this.entitiesMinusPlayer()) {
        if (entity.x === x && entity.y === y) {
          if (!entity?.isCollectible && entity.isPushable) {
            if (
              !this.pushNextEntity(
                [x - this.player.x, y - this.player.y],
                entity
              )
            ) {
              //if next entity was blocked
              walkable = false;
            }
          } else if (!entity.isWalkable) {
            if (
              entity.additionalProperties &&
              entity.additionalProperties['isVehicle'] &&
              !(
                entity.additionalProperties['isLocked'] &&
                !this.player.isInInventory('key')
              )
            ) {
              if (
                entity.additionalProperties &&
                entity.additionalProperties['isLocked'] &&
                this.player.isInInventory('key')
              ) {
                this.player.removeFromInventory(
                  this.player.isInInventory('key')
                );
              }
              if (
                entity.additionalProperties &&
                entity.additionalProperties['canSwim']
              ) {
                if (!this.player.additionalProperties) {
                  this.player.additionalProperties = JSON.parse(
                    JSON.stringify({ canSwim: true })
                  );
                } else {
                  this.player.additionalProperties['canSwim'] = true;
                }
              }
              this.player.playerIsInVehicle = entity;
              entity.playerIsIn = true;
            } else if (
              entity.additionalProperties &&
              entity.additionalProperties['locked'] &&
              this.player.isInInventory('key') !== null
            ) {
              this.player.removeFromInventory(this.player.isInInventory('key'));
              this.removeFromLevel(entity);
            } else if (
              this.player.additionalProperties &&
              this.player.additionalProperties['canSwim'] &&
              entity.additionalProperties &&
              entity.additionalProperties['isSwimeable']
            ) {
            } else {
              walkable = false;
            }
          } else if (entity?.isCollectible) {
            collectibles.push(entity);
          } else if (
            entity.additionalProperties &&
            entity.additionalProperties['wins']
          ) {
            this.won = true;
          }
        }
      }
      if (walkable) {
        //if cell was empty (or walkable)
        this.player.movePlayer(x, y);
        if (this.player.playerIsInVehicle) {
          this.player.playerIsInVehicle.moveEntity(x, y);
        }
        if (collectibles.length > 0) {
          for (let collectedObjects of this.collect(x, y)) {
            this.player.inventory.push(collectedObjects);
            this.entities.splice(
              this.entitiesMinusPlayer().indexOf(collectedObjects),
              1
            );
          }
        }
        let [foundWordsStr, foundWords]: [
          Array<string>,
          Array<Array<Record<string, [number, number]>>>
        ] = this.foundWords();
        let letterHere: Boolean = false;
        for (let i = 0; i < foundWordsStr.length; i++) {
          let lCopy: Array<Letter> = [];
          for (let letter of this.letters) {
            letterHere = false;
            for (let allFoundLetters of foundWords[i].reverse()) {
              if (
                letter.name === Object.keys(allFoundLetters)[0] &&
                letter.x ===
                  allFoundLetters[Object.keys(allFoundLetters)[0]][0] &&
                letter.y === allFoundLetters[Object.keys(allFoundLetters)[0]][1]
              ) {
                letterHere = true;
                break;
              }
            }
            if (!letterHere) {
              lCopy.push(letter);
            }
          }
          this.letters = lCopy;
          let obj: Record<string, any> = null;
          let mobs: Record<string, any> = recordedEntities.mobs;
          let collectibles: Record<string, any> = recordedEntities.collectibles;
          let obstacles: Record<string, any> = recordedEntities.obstacles;
          let vehicles: Record<string, any> = recordedEntities.vehicles;
          let other: Record<string, any> = recordedEntities.other;
          if (foundWordsStr[i] in collectibles) {
            obj = collectibles[foundWordsStr[i]];
            this.entities.push(
              new Entity(
                foundWordsStr[i],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][0],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][1],
                obj.cellSize,
                obj?.layerValue,
                obj?.isWalkable,
                obj?.isPushable,
                obj?.sprites,
                false,
                obj?.additionalProperties,
                'inert',
                true
              )
            );
          } else if (foundWordsStr[i] in mobs) {
            obj = mobs[foundWordsStr[i]];
            this.entities.push(
              new Entity(
                foundWordsStr[i],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][0],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][1],
                obj.cellSize,
                obj?.layerValue,
                obj?.isWalkable,
                obj?.isPushable,
                obj?.sprites,
                obj?.kills,
                obj?.additionalProperties,
                obj?.ai
              )
            );
            obj = mobs[foundWordsStr[i]];
          } else if (foundWordsStr[i] in obstacles) {
            obj = obstacles[foundWordsStr[i]];
            this.entities.push(
              new Entity(
                foundWordsStr[i],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][0],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][1],
                obj.cellSize,
                obj?.layerValue,
                obj?.isWalkable,
                obj?.isPushable,
                obj?.sprites,
                obj?.kills,
                obj?.additionalProperties,
                obj?.ai
              )
            );
          } else if (foundWordsStr[i] in vehicles) {
            obj = vehicles[foundWordsStr[i]];
            let additionalProperties: Record<string, any> = {};
            if (!obj?.additionalProperties) {
              additionalProperties = { isVehicle: true };
            } else if (!obj?.additionalProperties['isVehicle']) {
              additionalProperties = {
                ...obj.additionalProperties,
                isVehicle: true,
              };
            } else {
              additionalProperties = { ...obj.additionalProperties };
            }
            this.entities.push(
              new Entity(
                foundWordsStr[i],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][0],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][1],
                obj.cellSize,
                obj?.layerValue,
                obj?.isWalkable,
                obj?.isPushable,
                obj?.sprites,
                obj?.kills,
                JSON.parse(JSON.stringify(additionalProperties)), //not sure why, but Map/Record types are doing some shennanies here
                obj?.ai
              )
            );
          } else if (foundWordsStr[i] in other) {
            obj = other[foundWordsStr[i]];
            this.entities.push(
              new Entity(
                foundWordsStr[i],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][0],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][1],
                obj.cellSize,
                obj?.layerValue,
                obj?.isWalkable,
                obj?.isPushable,
                obj?.sprites,
                obj?.kills,
                obj?.additionalProperties,
                obj?.ai
              )
            );
          } else {
            throw 'UnreferencedEntityError';
          }
        }
      }
    }
  }
  public moveAIs(): void {
    this.entities.forEach((entity) => entity.aiMove(this));
  }

  public levelFromObject(obj: Record<string, any>): void {
    this.sizeX = obj['sizeX'];
    this.sizeY = obj['sizeY'];
    this.name = obj['name'];
    this.description = obj['description'];
    this.id = obj['id'] ? obj['id'] : getRandomArbitrary(0, 10000);
    this.debug = obj['debug'] ? obj['debug'] : false;
    this.letters = [];
    for (let letter of obj['letters']) {
      if (letter['sprites'] && letter['sprites'].length > 2) {
        this.letters.push(
          new Letter(
            letter['name'],
            letter['xPos'],
            letter['yPos'],
            letter['cellSize'],
            letter['layerValue'],
            letter['isWalkable'],
            letter['isPushable'],
            letter['sprites'] && letter['sprites'].length > 2
              ? letter['sprites']
              : []
          )
        );
      } else {
        let letterSprites: Array<string> = [
          'assets/images/letters/' + letter['name'] + '1.png',
          'assets/images/letters/' + letter['name'] + '2.png',
          'assets/images/letters/' + letter['name'] + '3.png',
        ];
        this.letters.push(
          new Letter(
            letter['name'],
            letter['xPos'],
            letter['yPos'],
            letter['cellSize'],
            letter['layerValue'],
            letter['isWalkable'],
            letter['isPushable'],
            letterSprites
          )
        );
      }
    }

    this.entities = [];
    for (let entity of obj['entities']) {
      this.entities.push(
        new Entity(
          entity['name'],
          entity['xPos'],
          entity['yPos'],
          entity['cellSize'],
          entity['layerValue'],
          entity['isWalkable'],
          entity['isPushable'],
          entity['sprites'] && entity['sprites'].length > 2
            ? entity['sprites']
            : [],
          entity['kills'],
          entity['additionalProperties'],
          entity['ai']
        )
      );
    }

    if (obj['player']['sprites'] && obj['player']['sprites'].length > 2) {
      this.player = new Player(
        obj['player']['xPos'],
        obj['player']['yPos'],
        obj['player']['cellSize'],
        obj['player']['layerValue'],
        obj['player']['sprites'] && obj['player']['sprites'].length > 2
          ? obj['player']['sprites']
          : []
      );
    } else {
      let playerSprites: Array<string> = [
        'assets/images/player/player1.png',
        'assets/images/player/player2.png',
        'assets/images/player/player3.png',
      ];

      this.player = new Player(
        obj['player']['xPos'],
        obj['player']['yPos'],
        obj['player']['cellSize'],
        obj['player']['layerValue'],
        playerSprites
      );
    }
  }
  public exportAsJSON(): Record<string, any> {
    //export from objects to JSON is not reliable enough
    let finalJSON: Record<string, any> = {};
    finalJSON['sizeX'] = this.sizeX;
    finalJSON['sizeY'] = this.sizeY;
    finalJSON['name'] = this.name;
    finalJSON['description'] = this.description;
    finalJSON['id'] = getRandomArbitrary(0, 10000); //idk why this is here in the first place...
    finalJSON['debug'] = this.debug;
    finalJSON['letters'] = [];
    finalJSON['entities'] = [];
    finalJSON['player'] = this.player.exportAsJSON();
    for (let e of this.entities) {
      finalJSON['entities'].push(e.exportAsJSON());
    }
    for (let l of this.letters) {
      finalJSON['letters'].push(l.exportAsJSON());
    }
    return finalJSON;
  }
}
