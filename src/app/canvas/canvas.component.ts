import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { HostListener } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { roundRect } from '../misc/utils';
import Entity from '../gameObjects/entity';
import Level from '../gameObjects/level';
import recordedEntities from '../../assets/entityData/entities.json';
@Component({
  selector: 'canvas-component',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvas')
  private mainCanvas: ElementRef = {} as ElementRef;
  private subsciption: Subscription;
  private cellSize: number = 100;
  ctx: CanvasRenderingContext2D;
  private level: Level;
  private missingTexturesImg: HTMLImageElement = new Image();
  private clockTick: number = 150; //arbitrary af
  private inventoryHeight: number = 200;
  private arrayIndexInventoryItems: Array<[number, number, number, number]> =
    []; //shitty way to keep the indexes of the inventory item boxes "dynamically"
  private imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  constructor() {
    this.missingTexturesImg.src =
      '../assets/images/entities/missingTextures.png';
  }
  mouseMove(e: Event) {

    //item selection, not yet implemented
    if (
      this.level.player.selectedInventoryItem >= 0 &&
      this.level.player.selectedInventoryItem <
        this.level.player.maxInventorySize
    ) {
      if (
        this.level.player.inventory[this.level.player.selectedInventoryItem]
      ) {
        // console.log(
        //   this.level.player.inventory[this.level.player.selectedInventoryItem]
        // );
      } else {
        // console.log('No item selected');
      }
    }
  }
  doClick(e: Event) {
    let selected: Boolean = false;
    if (
      this.arrayIndexInventoryItems.length ===
      this.level.player.maxInventorySize
    ) {
      for (let i = 0; i < this.arrayIndexInventoryItems.length; i++) {
        if (
          e['layerX'] >= this.arrayIndexInventoryItems[i][0] &&
          e['layerX'] <= this.arrayIndexInventoryItems[i][2] &&
          e['layerY'] >= this.arrayIndexInventoryItems[i][1] &&
          e['layerY'] <= this.arrayIndexInventoryItems[i][3]
        ) {
          if (this.level.player.selectedInventoryItem !== i) {
            this.level.player.selectedInventoryItem = i;
            selected = true;
          }
          else
          {
            this.level.player.selectedInventoryItem = -1;
          }
          break;
        }
      }
    }
    if (!selected) {
      this.level.player.selectedInventoryItem = -1;
    }
  }

  drawGrid(): void {
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.font = '10px serif';
    for (
      let i = 0;
      i <= this.mainCanvas.nativeElement.width;
      i += this.cellSize
    ) {
      if (
        this.level?.debug &&
        i < this.mainCanvas.nativeElement.height - this.inventoryHeight
      ) {
        this.ctx.fillStyle = 'red';
        this.ctx.fillText((i / this.cellSize).toString(), 0, i + 10);
      }
      this.ctx.moveTo(i, 0);
      this.ctx.strokeStyle = '#cccccc';
      this.ctx.lineTo(
        i,
        this.mainCanvas.nativeElement.height - this.inventoryHeight * 0.9
      );
    }
    for (
      let i = 0;
      i <= this.mainCanvas.nativeElement.height - this.inventoryHeight * 0.9;
      i += this.cellSize
    ) {
      if (this.level?.debug && i < this.mainCanvas.nativeElement.width) {
        this.ctx.fillStyle = 'blue';
        this.ctx.fillText((i / this.cellSize).toString(), i, 10);
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
          50 + (i * this.inventoryHeight) / 2,
          this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
          this.inventoryHeight / 2 - 10,
          this.inventoryHeight / 2 - 10,
          10,
          '#DDDD77'
        );
      } else {
        roundRect(
          this.ctx,
          50 + (i * this.inventoryHeight) / 2,
          this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
          this.inventoryHeight / 2 - 10,
          this.inventoryHeight / 2 - 10,
          10,
          '#7777DD'
        );
      }
      if (
        this.arrayIndexInventoryItems.length <
        this.level.player.maxInventorySize
      ) {
        this.arrayIndexInventoryItems.push([
          50 + (i * this.inventoryHeight) / 2,
          this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
          this.inventoryHeight / 2 - 10 + 50 + (i * this.inventoryHeight) / 2,
          this.inventoryHeight / 2 -
            10 +
            this.mainCanvas.nativeElement.height -
            this.inventoryHeight / 1.5,
        ]);
        console.log(this.arrayIndexInventoryItems);
      }

      if (i < this.level.player.inventory.length) {
        let inventoryItem: Entity = this.level.player.inventory[i];
        this.ctx.drawImage(
          this.imgMap[inventoryItem.name][inventoryItem.frame],
          50 + (i * this.inventoryHeight) / 2,
          this.mainCanvas.nativeElement.height - this.inventoryHeight / 1.5,
          this.inventoryHeight / 2 - 10,
          this.inventoryHeight / 2 - 10
        );
        inventoryItem.updateFrame();
      }
    }
  }

  animateObjects(entityArray: Array<Entity>): void {
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
      } else {
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

  restart() {
    this.subsciption.unsubscribe();
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
      // console.log(entities[j].name,entities[j].x, entities[j].y, x, y);
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
      case 'ArrowUp': //TODO: fix player clipping through moving entities
        y--;
        this.level.addToHistory();
        this.level.moveAIs();
        break;
      case 'ArrowDown':
        y++;
        this.level.addToHistory();
        this.level.moveAIs();
        break;
      case 'ArrowLeft':
        x--;
        this.level.addToHistory();
        this.level.moveAIs();
        break;
      case 'ArrowRight':
        x++;
        this.level.addToHistory();
        this.level.moveAIs();
        break;
      case 'u':
        this.level.undo();
        return;
      case 'r':
        this.restart();
        return;
      default:
        break;
    }
    if (this.level.checkPlayerDeath()) {
      this.restart();
    }
    //TODO: Fix this part so that multiple objects can be pushed. Also, make it legible.
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
  }

  async ngAfterViewInit(): Promise<void> {
    let levelData = await import('../../assets/level_data/test_level.json');
    this.level = new Level(levelData.default);
    //this.level.showData(); //For debugging only$
    // console.log(this.level.getWalkableMatrix());
    this.ctx = this.mainCanvas.nativeElement.getContext('2d');
    let cellHeight: number = this.cellSize;
    let safetyCounter: number = 0;
    // Optimization for the grid size, not strictly needed but eh, looks cool
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY > window.innerHeight - this.inventoryHeight
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
    this.cellSize = Math.floor(cellWidth);
    let theight = this.cellSize * this.level.sizeY;
    let twidth = this.cellSize * this.level.sizeX;
    this.ctx.canvas.height = theight + this.inventoryHeight * 0.9; //TODO : find a better fix for the height & width issue
    this.ctx.canvas.width = twidth;
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
    this.subsciption = timer(0, this.clockTick)
      .pipe()
      .subscribe(() => {
        this.animate();
      });
  }
  ngOnDestroy() {
    this.subsciption.unsubscribe();
  }
}
