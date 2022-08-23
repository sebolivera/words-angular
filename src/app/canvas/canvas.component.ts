import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import Player from '../gameObjects/player';
import { HostListener } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import Letter from '../gameObjects/letter';
import Entity from '../gameObjects/entity';
import Level from '../gameObjects/level';

@Component({
  selector: 'canvas-component',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvas')
  private mainCanvas: ElementRef = {} as ElementRef;
  private subsciption: Subscription;
  private allEntities: Array<Entity>;
  private cellSize: number = 100;
  ctx: CanvasRenderingContext2D;
  private level: Level;
  private steps: Array<Array<Entity>> = [];
  private missingTexturesImg:HTMLImageElement = new Image();
  private clockTick: number = 150; //arbitrary af
  private imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  constructor() {
    this.missingTexturesImg.src = '../assets/images/entities/missingTextures.png'
  }
  drawGrid(): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 2;
    this.ctx.font = '10px serif';
    for (
      let i = 0;
      i < this.mainCanvas.nativeElement.width;
      i += this.cellSize
    ) {
      this.ctx.fillStyle = 'red';
      this.ctx.fillText((i/this.cellSize).toString(), 0, i+10)
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.mainCanvas.nativeElement.height);
    }
    for (
      let i = 0;
      i < this.mainCanvas.nativeElement.height;
      i += this.cellSize
    ) {
      this.ctx.fillStyle = 'blue';
      this.ctx.fillText((i/this.cellSize).toString(), i, 10)
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.mainCanvas.nativeElement.width, i);
    }
    this.ctx.stroke();
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
      }
      // not needed right now, but will be useful if I need to remove background behind entities
      // this.ctx.beginPath();
      // this.ctx.fillStyle = 'white';
      // this.ctx.rect(
      //   entity.x * this.cellSize,
      //   entity.y * this.cellSize,
      //   this.cellSize,
      //   this.cellSize
      // );
      // this.ctx.fill();
      else {
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
    this.steps = [];
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
    if (this.steps.length > 1000) {
      this.steps.shift(); //don't want to keep too many steps in case of memory issues
    }
    switch (event.key) {
      case 'ArrowUp':
        y--;
        this.allEntities.forEach(entity => entity.aiMove(this.level))
        this.steps.push(
          this.allEntities.map((e) => JSON.parse(JSON.stringify(e)))
        );
        break;
      case 'ArrowDown':
        y++;
        this.allEntities.forEach(entity => entity.aiMove(this.level))
        this.steps.push(
          this.allEntities.map((e) => JSON.parse(JSON.stringify(e)))
        );
        break;
      case 'ArrowLeft':
        x--;
        this.allEntities.forEach(entity => entity.aiMove(this.level))
        this.steps.push(
          this.allEntities.map((e) => JSON.parse(JSON.stringify(e)))
        );
        break;
      case 'ArrowRight':
        x++;
        this.allEntities.forEach(entity => entity.aiMove(this.level))
        this.steps.push(
          this.allEntities.map((e) => JSON.parse(JSON.stringify(e)))
        );
        break;
      case 'u':
        if (this.steps.length > 1) {
          for (let i = 0; i < this.steps[this.steps.length - 1].length; i++) {
            this.allEntities[i].setAll(this.steps[this.steps.length - 1][i]);
          }
          this.steps.pop();
        }
        return;
      case 'r':
        this.restart();
        return;
      default:
        break;
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
      > = this.getEntitiesAtCoordinates(this.allEntities, x, y);
      if (entitiesAtCoordinates.get('death').length > 0) {
        this.restart();
      }
      if (entitiesAtCoordinates.get('adminwall').length === 0) {
        if (entitiesAtCoordinates.get('pushable').length > 0) {
          for (
            let i = 0;
            i < entitiesAtCoordinates.get('pushable').length;
            i++
          ) {
            if (
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                (this.level.player.x - x) >=
                0 &&
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                (this.level.player.x - x) <
                Math.floor(
                  this.mainCanvas.nativeElement.width / this.cellSize
                ) &&
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                (this.level.player.y - y) >=
                0 &&
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                (this.level.player.y - y) <
                Math.floor(this.mainCanvas.nativeElement.height / this.cellSize)
            ) {
              let entitiesBehindCoordinates: Map<
                string,
                Array<string>
              > = this.getEntitiesAtCoordinates(
                this.allEntities,
                this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                  (this.level.player.x - x),
                this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                  (this.level.player.y - y)
              );
              if (
                entitiesBehindCoordinates.get('adminwall').length === 0 &&
                entitiesBehindCoordinates.get('pushable').length === 0 &&
                entitiesBehindCoordinates.get('walkable').length === 0
              ) {
                this.allEntities[
                  entitiesAtCoordinates.get('pushable')[i]
                ].moveEntity(
                  this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                    (this.level.player.x - x),
                  this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                    (this.level.player.y - y)
                );
                this.level.player.movePlayer(x, y);
              }
            }
          }
        } else {
          this.level.player.movePlayer(x, y);
        }
      }
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
    this.animateObjects(this.allEntities);
  }

  async ngAfterViewInit(): Promise<void> {
    let levelData = await import('../../assets/level_data/test_level.json');
    this.level = new Level(levelData.default);
    //this.level.showData(); //For debugging only$
    // console.log(this.level.getWalkableMatrix());
    this.ctx = this.mainCanvas.nativeElement.getContext('2d');
    let cellHeight = this.cellSize;
    let safetyCounter = 0;

    // Optimization for the grid size, not strictly needed but eh, looks cool
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY > window.innerHeight
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
    this.allEntities = [...this.level.letters];
    this.allEntities = this.allEntities.concat([...this.level.entities]);
    this.allEntities.push(this.level.player);
    this.ctx.canvas.height = theight; //TODO : find a fix for the height & width issue
    this.ctx.canvas.width = twidth;
    this.drawGrid();

    // Draws a dot, forgot why
    // this.ctx.fillStyle = 'red';
    // this.ctx.beginPath();
    // this.ctx.arc(
    //   this.level.player.x * this.cellSize + this.cellSize / 2,
    //   this.level.player.y * this.cellSize + this.cellSize / 2,
    //   this.cellSize / 2,
    //   0,
    //   2 * Math.PI
    // );

    this.ctx.fill();
    for (let i = 0; i < this.allEntities.length; i++) {
      let name = this.allEntities[i].name;
      this.imgMap[name] = [];
      for (let j = 0; j < this.allEntities[i].sprites.length; j++) {
        this.imgMap[name].push(new Image());
        this.imgMap[name][this.imgMap[name].length - 1].src =
          this.allEntities[i].sprites[j];
      }
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
