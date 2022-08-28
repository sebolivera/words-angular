import Entity from './entity';
import Letter from './letter';
import Player from './player';
import recordedEntities from '../../assets/entityData/entities.json';
import Collectible from './collectible';

export default class Level {
  public sizeX: number;
  public sizeY: number;
  public name: string;
  public id: number;
  public player: Player;
  public letters: Array<Letter>;
  public entities: Array<Entity>;
  public debug: Boolean;
  public levelHistory: Array<Record<string, any>> = [];
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
      if (initObject.entities[i]?.isCollectible) {
        tentities.push(
          new Collectible(
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
            initObject.entities[i].additionnalProperties,
            initObject.isCollectible
          )
        );
      } else {
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
            initObject.entities[i].kills,
            initObject.entities[i].additionnalProperties,
            initObject.entities[i]?.ai
          )
        );
      }
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
    }
    else
    {
      this.player = new Player(Math.floor(this.sizeX/2), Math.floor(this.sizeY/2),
      1,
      0,
      playerSprites)
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
            (e.additionnalProperties &&
              e['additionnalProperties']['absoluteDeath']))
      ).length > 0
    );
  };

  public canCollect = (): Boolean => {
    return (
      this.entities.filter(
        (e) =>
          e.x === this.player.x &&
          e.y === this.player.y &&
          e instanceof Collectible
      ).length > 0
    );
  };

  public collect = (x: number, y: number): Array<Collectible> => {
    let collectiblesFound: Array<Collectible> = [];
    this.entities.forEach((e) => {
      if (e.x === x && e.y === y && e instanceof Collectible) {
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
      this.id = this.levelHistory[this.levelHistory.length - 1].id;
      for (let [pKey, pValue] of Object.entries(
        this.levelHistory[this.levelHistory.length - 1].player
      )) {
        this.player[pKey] = pValue;
      }
      this.letters = this.levelHistory[this.levelHistory.length - 1].letters;
      this.entities = this.levelHistory[this.levelHistory.length - 1].entities;
      this.debug = this.levelHistory[this.levelHistory.length - 1].debug;
      this.levelHistory.pop();
    }
  }

  public getWalkableMatrix(): Array<Array<Boolean>> {
    //creates a matrix of cells. Walkable cells are marked as true, non-walkable ones are marked as false

    let matrix: Array<Array<Boolean>> = [];
    for (let i = 0; i < this.sizeY; i++) {
      matrix.push(new Array(this.sizeX).fill(true));
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
          entity.additionnalProperties &&
          entity.additionnalProperties['canSwim'] &&
          e.additionnalProperties &&
          e.additionnalProperties['isSwimeable']
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
    for (let i = 0; i < this.sizeY; i++) {
      for (let j = 0; j < this.sizeX; j++) {
        currentReadWordHoz = [];
        if (letterGrid[i][j]) {
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
              break;
            }
          }
        }
      }
    }
    for (let j = 0; j < this.sizeX; j++) {
      for (let i = 0; i < this.sizeY; i++) {
        currentReadWordVert = [];
        if (letterGrid[i][j]) {
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
                  foundWords[foundWords.length - 1].push({
                    [letter]: [
                      currentReadWordVert[n].x,
                      currentReadWordVert[n].y,
                    ],
                  });
              }
              foundWordsStr.push(word);
              break;
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
    let collectibles: Array<Collectible> = [];
    if (x < this.sizeX && y < this.sizeY) {
      for (let entity of this.entitiesMinusPlayer()) {
        if (entity.x === x && entity.y === y) {
          if (
            !(entity instanceof Collectible && entity.isCollectible) &&
            entity.isPushable
          ) {
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
            //if cell is occupied by a non-walkable (ex: wall)
            // console.info('trying to walk into', entity, "with");
            // console.log(entity.additionnalProperties, entity.additionnalProperties['locked'], this.player.isInInventory('key'))
            if (
              entity.additionnalProperties &&
              entity.additionnalProperties['isVehicle'] &&
              !(
                entity.additionnalProperties['isLocked'] &&
                !this.player.isInInventory('key')
              )
            ) {
              if (
                entity.additionnalProperties &&
                entity.additionnalProperties['isLocked'] &&
                this.player.isInInventory('key')
              ) {
                this.player.removeFromInventory(
                  this.player.isInInventory('key')
                );
              }
              if (
                entity.additionnalProperties &&
                entity.additionnalProperties['canSwim']
              ) {
                if (!this.player.additionnalProperties) {
                  this.player.additionnalProperties = JSON.parse(
                    JSON.stringify({ canSwim: true })
                  );
                } else {
                  this.player.additionnalProperties['canSwim'] = true;
                }
              }
              this.player.playerIsInVehicle = entity;
            } else if (
              entity.additionnalProperties &&
              entity.additionnalProperties['locked'] &&
              this.player.isInInventory('key') !== null
            ) {
              this.player.removeFromInventory(this.player.isInInventory('key'));
              this.removeFromLevel(entity);
            } else if (
              this.player.additionnalProperties &&
              this.player.additionnalProperties['canSwim'] &&
              entity.additionnalProperties &&
              entity.additionnalProperties['isSwimeable']
            ) {
            } else {
              walkable = false;
            }
          } else if (entity instanceof Collectible) {
            collectibles.push(entity as Collectible);
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
            for (let allFoundLetters of foundWords[i]) {
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
              new Collectible(
                foundWordsStr[i],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][0],
                Object.values(foundWords[i][foundWords[i].length - 1])[0][1],
                obj.cellSize,
                obj?.layerValue,
                obj?.isWalkable,
                obj?.isPushable,
                obj?.sprites,
                obj?.additionnalProperties,
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
                obj?.additionnalProperties,
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
                obj?.additionnalProperties,
                obj?.ai
              )
            );
          } else if (foundWordsStr[i] in vehicles) {
            obj = vehicles[foundWordsStr[i]];
            let additionnalProperties: Record<string, any> = {};
            if (!obj?.additionnalProperties) {
              additionnalProperties = { isVehicle: true };
            } else if (!obj?.additionnalProperties['isVehicle']) {
              additionnalProperties = {
                ...obj.additionnalProperties,
                isVehicle: true,
              };
            } else {
              additionnalProperties = { ...obj.additionnalProperties };
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
                JSON.parse(JSON.stringify(additionnalProperties)), //not sure why, but Map/Record types are doing some shennanies here
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
                obj?.additionnalProperties,
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
  public showData(): void {
    // FOR DEBBUGING PURPOSES ONLY, DELETE IT LATER
    console.log(
      '\n\n\n\n\n============================Level contents============================'
    );
    console.log('>id:', this.id);
    console.log('>name:', this.name);
    console.log('>letters:', this.letters);
    console.log('>entities:', this.entities);
    console.log('>player:', this.player);
    console.log('>sizeX:', this.sizeX);
    console.log('>sizeY:', this.sizeY);
    console.log(
      '============================End level contents============================\n\n\n\n\n'
    );
  }
}
