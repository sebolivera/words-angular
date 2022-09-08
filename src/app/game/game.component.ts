import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { HostListener } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { roundRect } from '../misc/utils';
import Entity from '../gameObjects/entity';
import Level from '../gameObjects/level';
import recordedEntities from '../../assets/entityData/entities.json';
@Component({
  selector: 'game-component',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit {
  @ViewChild('mainCanvas')
  private mainCanvas: ElementRef = {} as ElementRef;
  private subscription: Subscription;
  private cellSize: number = 100;
  public moveAmount: number = 0;
  private ctx: CanvasRenderingContext2D;
  private level: Level;
  public recordedEntitiesAsSimpleDict: Record<string, any> = {};
  private missingTexturesImg: HTMLImageElement = new Image();
  private clockTick: number = 150; //arbitrary af
  private inventoryHeight: number = 200;
  private initCellSize: number = 200;
  public displayEntity: Entity = null;
  public globalFrame: number = 0;
  private winCondImage: Array<HTMLImageElement> = [];
  private debug: Boolean = false; //get rid of it later
  private arrayIndexInventoryItems: Array<[number, number, number, number]> =
    []; //shitty way to keep the indexes of the inventory item boxes "dynamically". I have no idea why I did it that way
  public imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  public selectedLevel: string = 'Level 1';
  public allLevels: Record<string, any> = {};
  public letterImgMap: Record<string, Array<HTMLImageElement>> = {}; //only for text display
  constructor() {
    this.missingTexturesImg.src =
      '../assets/images/entities/missingTextures.png';
    for (let i = 1; i <= 3; i++) {
      this.winCondImage.push(new Image());
      this.winCondImage[this.winCondImage.length - 1].src =
        '/assets/images/entities/WinCond' + i + '.png';
    }
    for (let letter of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
      this.letterImgMap[letter] = [];
      for (let i = 1; i <= 3; i++) {
        this.letterImgMap[letter].push(new Image());
        this.letterImgMap[letter][i - 1].src =
          'assets/images/letters/' + letter + i + '.png';
      }
    }
  }

  recalculateCanvasSize() {
    let cellHeight: number = this.initCellSize;
    let safetyCounter: number = 0;
    // Optimization for the grid size, not strictly needed but eh, looks cool
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY >
        window.innerHeight - cellHeight * 2 - this.inventoryHeight
    ) {
      cellHeight *= 0.9; //somehow giving this more precision makes the grid overflow to to the bottom...?
      safetyCounter += 1;
    }
    let cellWidth = Math.floor(cellHeight);
    safetyCounter = 0;
    while (
      safetyCounter < 100 &&
      cellWidth * this.level.sizeX > window.innerWidth
    ) {
      cellWidth *= 0.9;
      safetyCounter += 1;
    }
    this.cellSize = Math.floor(cellWidth < cellHeight ? cellWidth : cellHeight);
    let theight = this.cellSize * this.level.sizeY + this.inventoryHeight;
    let twidth = this.cellSize * this.level.sizeX;
    this.ctx.canvas.height = theight; //canvas overflows a little bit to the bottom because of the titles etc. TODO: change how that works
    this.ctx.canvas.width = twidth;

    this.drawGrid();
  }
  mouseMove(e: Event) {
    if (!this.level || !this.level.won) {
      //entity hover
      let hovered: Boolean = false;
      let rect = this.ctx.canvas.getBoundingClientRect();
      for (let entity of this.level.entitiesAndPlayer()) {
        if (
          Math.floor((e['clientX'] - rect.left) / this.cellSize) === entity.x &&
          Math.floor((e['clientY'] - rect.top) / this.cellSize) === entity.y
        ) {
          hovered = true;
          if (this.level.player.selectedInventoryItem === -1) {
            this.displayEntity = entity;
          }
          break;
        }
      }
      if (!hovered && this.level.player.selectedInventoryItem === -1) {
        this.displayEntity = null;
      }
    }
  }
  doClick(e: Event) {
    let rect = this.ctx.canvas.getBoundingClientRect();
    let selected: Boolean = false;
    if (
      this.arrayIndexInventoryItems.length ===
      this.level.player.maxInventorySize
    ) {
      //inventory item selection
      for (let i = 0; i < this.arrayIndexInventoryItems.length; i++) {
        if (
          e['clientX'] - rect.left >= this.arrayIndexInventoryItems[i][0] &&
          e['clientX'] - rect.left <= this.arrayIndexInventoryItems[i][2] &&
          e['clientY'] - rect.top >= this.arrayIndexInventoryItems[i][1] &&
          e['clientY'] - rect.top <= this.arrayIndexInventoryItems[i][3]
        ) {
          if (this.level.player.selectedInventoryItem !== i) {
            if (this.level.player.inventory[i]) {
              this.level.player.selectedInventoryItem = i;
              selected = true;
              this.displayEntity =
                this.level.player.inventory[
                  this.level.player.selectedInventoryItem
                ];
            }
          } else {
            this.level.player.selectedInventoryItem = -1;
            this.displayEntity = null;
            selected = false;
          }
          break;
        }
      }
      //action on cell (near the player)
      if (this.level.player.selectedInventoryItem !== -1) {
        let tinyX: number = Math.floor(
          (e['clientX'] - rect.left) / this.cellSize
        );
        let tinyY: number = Math.floor(
          (e['clientY'] - rect.top) / this.cellSize
        );
        if (
          Math.abs(tinyX - this.level.player.x) < 2 &&
          Math.abs(tinyY - this.level.player.y) < 2 &&
          (tinyX !== this.level.player.x || tinyY !== this.level.player.y)
        ) {
          this.level.useInventoryItem(tinyX, tinyY, this.level.player.selectedInventoryItem);
        }
      }
    }
    // if (!this.level.player.inventory[
    //   this.level.player.selectedInventoryItem
    // ])
    // {
    //   selected = false;
    //   this.displayEntity=null;
    // }
    if (!selected) {
      this.level.player.selectedInventoryItem = -1;
    }
  }

  drawGrid(): void {
    if (this.level && this.level.won) {
      this.ctx.beginPath();
      this.ctx.drawImage(
        this.winCondImage[this.globalFrame],
        Math.floor(((this.level.sizeX - 1) / 2) * this.cellSize),
        Math.floor(((this.level.sizeY - 1) / 2) * this.cellSize),
        100,
        100
      );

      this.ctx.fillStyle = 'black';
      this.ctx.font = "30px 'Brush Script MT', cursive";

      let winSentence: Array<string> = 'Press n to go to the next level'
        .toLowerCase()
        .split('');
      let sentenceLength = winSentence.length * 10;
      for (let i = 0; i < winSentence.length; i++) {
        if (winSentence[i] !== ' ') {
          this.ctx.drawImage(
            this.letterImgMap[winSentence[i]][this.globalFrame],
            (this.ctx.canvas.width - sentenceLength) / 2 + i * 10, //I am crap at math
            ((this.level.sizeY - 1) / 2) * this.cellSize + 150,
            10,
            10
          );
        }
      }
      this.ctx.closePath();
    } else {
      this.ctx.font = '10px Arial';
      this.ctx.beginPath();
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#cccccc';
      this.ctx.font = '10px serif';
      for (
        let i = 0;
        i <= this.mainCanvas.nativeElement.width;
        i += this.cellSize
      ) {
        if (this.level?.debug && i < this.mainCanvas.nativeElement.width) {
          this.ctx.fillStyle = 'blue';
          this.ctx.fillText((i / this.cellSize).toString(), i, 10);
        }
        this.ctx.moveTo(i, 0);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineTo(i, this.cellSize * this.level.sizeY);
      }
      for (
        let i = 0;
        i <= this.mainCanvas.nativeElement.height - this.inventoryHeight * 0.9;
        i += this.cellSize
      ) {
        if (
          this.level?.debug &&
          i < this.mainCanvas.nativeElement.height - this.inventoryHeight
        ) {
          this.ctx.fillStyle = 'red';
          this.ctx.fillText((i / this.cellSize).toString(), 0, i + 10);
        }
        this.ctx.moveTo(0, i);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineTo(this.mainCanvas.nativeElement.width, i);
      }
      this.ctx.stroke();
      this.ctx.closePath();
      for (let i = 0; i < this.level.player.maxInventorySize; i++) {
        if (this.level.player.selectedInventoryItem === i) {
          roundRect(
            this.ctx,
            10 + (i * this.inventoryHeight) / 2,
            this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
            this.inventoryHeight / 2 - 10,
            this.inventoryHeight / 2 - 10,
            10,
            '#DDDD77'
          );
          for (
            let ii = Math.max(0, this.level.player.y - 1);
            ii <= Math.min(this.level.sizeY - 1, this.level.player.y + 1);
            ii++
          ) {
            for (
              let jj = Math.max(0, this.level.player.x - 1);
              jj <= Math.min(this.level.sizeX - 1, this.level.player.x + 1);
              jj++
            ) {
              if (
                ii === this.level.player.y
                  ? jj !== this.level.player.x
                  : jj === this.level.player.x
              ) {
                //XOR
                let fillStyle = this.ctx.fillStyle;
                this.ctx.fillStyle = '#DDDD77';
                //highlights the cells next to the player
                this.ctx.fillRect(
                  jj * this.cellSize,
                  ii * this.cellSize,
                  this.cellSize,
                  this.cellSize
                );
                this.ctx.globalAlpha = 0.4;
                this.ctx.fillStyle = fillStyle;
                //draws a phantom version of the item on the cells
                this.ctx.drawImage(
                  this.imgMap[
                    this.level.player.inventory[
                      this.level.player.selectedInventoryItem
                    ].name
                  ][
                    this.level.player.inventory[
                      this.level.player.selectedInventoryItem
                    ].frame
                  ],
                  jj * this.cellSize,
                  ii * this.cellSize,
                  this.cellSize,
                  this.cellSize
                );
                this.ctx.globalAlpha = 1;
              }
            }
          }
        } else {
          roundRect(
            this.ctx,
            10 + (i * this.inventoryHeight) / 2,
            this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
            this.inventoryHeight / 2 - 10,
            this.inventoryHeight / 2 - 10,
            10,
            '#7777DD'
          ); //draws the selected inventory border in blue
        }
        if (
          this.arrayIndexInventoryItems.length <
          this.level.player.maxInventorySize
        ) {
          this.arrayIndexInventoryItems.push([
            10 + (i * this.inventoryHeight) / 2,
            this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
            10 + (i * this.inventoryHeight) / 2 + this.inventoryHeight / 2 - 10,
            this.mainCanvas.nativeElement.height -
              this.inventoryHeight / 1.5 +
              this.inventoryHeight / 2 -
              10,
          ]);
        }

        if (i < this.level.player.inventory.length) {
          let inventoryItem: Entity = this.level.player.inventory[i];
          this.ctx.drawImage(
            this.imgMap[inventoryItem.name][inventoryItem.frame],
            10 + (i * this.inventoryHeight) / 2,
            this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
            this.inventoryHeight / 2 - 10,
            this.inventoryHeight / 2 - 10
          );
          inventoryItem.updateFrame();
        }
      }
    }
  }

  animateObjects(entityArray: Array<Entity>): void {
    if (!this.level || !this.level.won) {
      entityArray.forEach((entity) => {
        if (entity.name === 'player') {
          this.ctx.drawImage(
            this.imgMap[entity.name][entity.frame],
            entity.x * this.cellSize,
            entity.y * this.cellSize,
            this.cellSize,
            this.cellSize
          );
          entity.updateFrame();
        } else if (
          entity === this.level.player.playerIsInVehicle ||
          entity.x !== this.level.player.x ||
          entity.y !== this.level.player.y
        ) {
          try {
            this.ctx.drawImage(
              this.imgMap[entity.name][entity.frame],
              entity.x * this.cellSize,
              entity.y * this.cellSize,
              this.cellSize,
              this.cellSize
            );
          } catch (e: any) {
            this.ctx.drawImage(
              this.missingTexturesImg,
              entity.x * this.cellSize,
              entity.y * this.cellSize,
              this.cellSize,
              this.cellSize
            );
          }
          entity.updateFrame();
        }
      });
    }
  }

  restart() {
    this.subscription.unsubscribe();
    this.moveAmount = 0;
    this.recalculateCanvasSize();
    this.ngAfterViewInit();
  }

  getEntitiesAtCoordinates(
    entities: Array<Entity>,
    x: number,
    y: number
  ): Map<string, Array<string>> {
    //checks the coordinates of all entities, gets their name if they're on x, y
    let entitiesFound: Map<string, Array<string>> = new Map<
      string,
      Array<string>
    >([
      ['walkable', []],
      ['pushable', []],
      ['adminwall', []],
      ['death', []],
    ]);
    let walkable = [];
    let pushable = [];
    let adminwall = [];
    let death = [];
    for (let j = 0; j < entities.length; j++) {
      if (entities[j].x === x && entities[j].y === y) {
        if (entities[j].isPushable) {
          pushable.push(j);
        } else if (entities[j].isWalkable) {
          walkable.push(j);
        } else {
          adminwall.push(j);
        }
        if (entities[j].kills) {
          death.push(j);
        }
      }
    }
    entitiesFound.set('pushable', pushable);
    entitiesFound.set('walkable', walkable);
    entitiesFound.set('adminwall', adminwall);
    entitiesFound.set('death', death);
    return entitiesFound;
  }

  @HostListener('document:keydown', ['$event'])
  move(event: KeyboardEvent): void {
    let x = this.level.player.x;
    let y = this.level.player.y;
    switch (event.key) {
      case 'ArrowUp':
        if (!this.level || !this.level.won) {
          y--;
          this.level.addToHistory();
          this.level.moveAIs();
          this.moveAmount++;
        }
        break;
      case 'ArrowDown':
        if (!this.level || !this.level.won) {
          y++;
          this.level.addToHistory();
          this.level.moveAIs();
          this.moveAmount++;
        }
        break;
      case 'ArrowLeft':
        if (!this.level || !this.level.won) {
          x--;
          this.level.addToHistory();
          this.level.moveAIs();
          this.moveAmount++;
        }
        break;
      case 'ArrowRight':
        if (!this.level || !this.level.won) {
          x++;
          this.level.addToHistory();
          this.level.moveAIs();
          this.moveAmount++;
        }
        break;
      case 'u':
        if (!this.level || !this.level.won) {
          this.level.undo();
          if (this.moveAmount > 0) {
            this.moveAmount--;
          }
          return;
        }
        break;
      case 'r':
        this.restart();
        return;
      case 'n':
        if (this.level.won) {
          let levelKeys: Array<string> = Object.keys(this.allLevels);
          if (
            levelKeys.indexOf(this.level.name) < levelKeys.length - 1 &&
            levelKeys.indexOf(this.level.name) !== -1
          ) {
            this.selectedLevel =
              levelKeys[levelKeys.indexOf(this.level.name) + 1];
            this.restart();
          }
        }
        return;
      default:
        break;
    }
    if (this.level.checkPlayerDeath()) {
      this.restart();
    }
    if (
      x >= 0 &&
      y >= 0 &&
      x <=
        Math.floor(this.mainCanvas.nativeElement.width / this.cellSize) - 1 &&
      y <= Math.floor(this.mainCanvas.nativeElement.height / this.cellSize) - 1
    ) {
      //check if the player is in bounds
      let entitiesAtCoordinates: Map<
        string,
        Array<string>
      > = this.getEntitiesAtCoordinates(this.level.entitiesMinusPlayer(), x, y);
      if (entitiesAtCoordinates.get('death').length > 0) {
        this.restart();
      }
      this.level.movePlayer(x, y);
    }
  }

  animate() {
    this.ctx.lineWidth = 0;
    this.ctx.beginPath();
    this.ctx.fillStyle = 'white';
    this.ctx.rect(
      0,
      0,
      this.mainCanvas.nativeElement.width,
      this.mainCanvas.nativeElement.height
    );
    this.ctx.fill();
    this.drawGrid(); //grid is behind everything else
    this.animateObjects(this.level.entitiesAndPlayer());
    this.globalFrame = (this.globalFrame + 1) % 3;
  }

  loadAllLevels = async () => {
    let levelRecord: Record<string, any> = {};
    let i: number = 1;
    let tmpLevelData = null;
    while (1) {
      try {
        await import('../../assets/level_data/Level ' + i + '.json')
          .then((data) => {
            tmpLevelData = data;
          })
          .catch(() => {
            throw 'NotFoundError';
          });
      } catch {
        break;
      }
      levelRecord[tmpLevelData.name] = tmpLevelData.default;
      i++;
    }
    if (this.debug) {
      console.info('Debug mode on.');
      let additionalLevel: any = null;
      for (let names of ['test_level', 'testCat&rat']) {
        additionalLevel = await import(
          '../../assets/level_data/' + names + '.json'
        );
        levelRecord[additionalLevel.name] = additionalLevel.default;
      }
    }
    return levelRecord;
  };

  selectLevel(event: Event) {
    this.selectedLevel = event.target['value'];
    this.restart();
  }

  async ngAfterViewInit(): Promise<void> {
    for (let entityOfTypes of Object.values(recordedEntities)) {
      for (let [name, entity] of Object.entries(entityOfTypes)) {
        this.recordedEntitiesAsSimpleDict[name] = entity;
      }
    }
    this.recordedEntitiesAsSimpleDict['player'] = {
      name: 'Player',
      verboseName: 'You',
      description: "That's you, the player. You look good ;)",
    };
    this.allLevels = await this.loadAllLevels();
    this.ctx = this.mainCanvas.nativeElement.getContext('2d');

    let levelData: any = null;
    if (!this.selectedLevel) {
      levelData = this.allLevels['Level 1'];
    } else {
      levelData = this.allLevels[this.selectedLevel];
    }
    this.level = new Level(levelData);
    this.recalculateCanvasSize();

    this.drawGrid();

    this.ctx.fill();
    for (let i = 0; i < this.level.entitiesMinusPlayer().length; i++) {
      let name = this.level.entitiesMinusPlayer()[i].name;
      this.imgMap[name] = [];
      for (
        let j = 0;
        j < this.level.entitiesMinusPlayer()[i].sprites.length;
        j++
      ) {
        this.imgMap[name].push(new Image());
        this.imgMap[name][this.imgMap[name].length - 1].src =
          this.level.entitiesMinusPlayer()[i].sprites[j];
      }
    }
    for (let objectTypes of Object.keys(recordedEntities)) {
      for (let objName of Object.keys(recordedEntities[objectTypes])) {
        if (!(objName in this.imgMap)) {
          this.imgMap[objName] = [];
          if (recordedEntities[objectTypes].sprites) {
            for (
              let i = 0;
              i < recordedEntities[objectTypes].sprites.length;
              i++
            ) {
              this.imgMap[objName].push(new Image());
              this.imgMap[objName][this.imgMap[objName].length - 1].src =
                recordedEntities[objectTypes].sprites[i];
            }
          } else {
            for (let i = 0; i < 3; i++) {
              this.imgMap[objName].push(new Image());
              this.imgMap[objName][this.imgMap[objName].length - 1].src =
                'assets/images/entities/' + objName + (i + 1) + '.png';
            }
          }
        }
      }
    }
    for (let i = 0; i < this.level.letters.length; i++) {
      let name = this.level.letters[i].name;
      this.imgMap[name] = [];
      for (let j = 0; j < this.level.letters[i].sprites.length; j++) {
        this.imgMap[name].push(new Image());
        this.imgMap[name][this.imgMap[name].length - 1].src =
          this.level.letters[i].sprites[j];
      }
    }
    this.imgMap['player'] = [];
    for (let j = 0; j < this.level.player.sprites.length; j++) {
      this.imgMap['player'].push(new Image());
      this.imgMap['player'][this.imgMap['player'].length - 1].src =
        this.level.player.sprites[j];
    }
    this.subscription = timer(0, this.clockTick)
      .pipe()
      .subscribe(() => {
        this.animate();
      });
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
