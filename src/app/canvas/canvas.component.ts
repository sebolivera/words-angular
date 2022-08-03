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
  private allEntities: Map<string, Entity>;
  private cellSize: number = 25;
  ctx: CanvasRenderingContext2D;
  private player: Player;
  private level: Level;
  private clockTick: number = 150; //arbitrary af
  private letterObjects: Map<string, Letter> = new Map<string, Letter>();
  private letters: string = 'abcdefghijklmnopqrstuvwxyz';
  private rows: number;
  private cols: number;
  private imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  constructor() {
    this.player = new Player(5, 10, this.cellSize, 0, [
      'assets/images/player1.png',
      'assets/images/player2.png',
      'assets/images/player3.png',
    ]);
    // this.level = new Level ();
  }
  drawGrid(): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 2;
    for (
      let i = 0;
      i < this.mainCanvas.nativeElement.width;
      i += this.cellSize
    ) {
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.mainCanvas.nativeElement.height);
    }
    for (
      let i = 0;
      i < this.mainCanvas.nativeElement.height;
      i += this.cellSize
    ) {
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.mainCanvas.nativeElement.width, i);
    }
    this.ctx.stroke();
  }

  animateObjects(
    entityArray: Array<Map<string, Entity>>,
    player: Player = null
  ): void {
    entityArray.forEach((entities) => {
      if (player) {
        this.ctx.drawImage(
          this.imgMap[player.name][player.frame],
          player.x * this.cellSize,
          player.y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
        player.updateFrame();
      }
      Object.keys(entities).forEach((key) => {
        let entity = entities[key];
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
        this.ctx.drawImage(
          this.imgMap[entity.name][entity.frame],
          entity.x * this.cellSize,
          entity.y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
        entity.updateFrame();
      });
    });
  }

  getEntitiesAtCoordinates(
    entities: Map<string, Entity>,
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
      ['wall', []],
    ]);
    let walkable = [];
    let pushable = [];
    let wall = [];
    for (let j = 0; j < Object.keys(entities).length; j++) {
      // console.log(entities[Object.keys(entities)[j]].name,entities[Object.keys(entities)[j]].x, entities[Object.keys(entities)[j]].y, x, y);
      if (
        entities[Object.keys(entities)[j]].x === x &&
        entities[Object.keys(entities)[j]].y === y
      ) {
        if (entities[Object.keys(entities)[j]].isPushable) {
          pushable.push(Object.keys(entities)[j]);
        } else if (entities[Object.keys(entities)[j]].isWalkable) {
          walkable.push(Object.keys(entities)[j]);
        } else {
          wall.push(Object.keys(entities)[j]);
        }
      }
    }
    entitiesFound.set('pushable', pushable);
    entitiesFound.set('walkable', walkable);
    entitiesFound.set('wall', wall);
    return entitiesFound;
  }

  @HostListener('document:keydown', ['$event'])
  move(event: KeyboardEvent): void {
    let x = this.player.x;
    let y = this.player.y;
    let oldX = x;
    let oldY = y;
    switch (event.key) {
      case 'ArrowUp':
        y--;
        break;
      case 'ArrowDown':
        y++;
        break;
      case 'ArrowLeft':
        x--;
        break;
      case 'ArrowRight':
        x++;
        break;
      default:
        break;
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
      > = this.getEntitiesAtCoordinates(this.allEntities, x, y);
      if (entitiesAtCoordinates.get('wall').length === 0) {
        if (entitiesAtCoordinates.get('pushable').length > 0) {
          for (
            let i = 0;
            i < entitiesAtCoordinates.get('pushable').length;
            i++
          ) {
            if (
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                (this.player.x - x) >
                0 &&
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                (this.player.x - x) <
                Math.floor(
                  this.mainCanvas.nativeElement.width / this.cellSize
                ) -
                  1 &&
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                (this.player.y - y) >
                0 &&
              this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                (this.player.y - y) <
                Math.floor(this.mainCanvas.nativeElement.height / this.cellSize)
            ) {
              let entitiesBehindCoordinates: Map<
                string,
                Array<string>
              > = this.getEntitiesAtCoordinates(
                this.allEntities,
                this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                  (this.player.x - x),
                this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                  (this.player.y - y)
              );
              if (
                entitiesBehindCoordinates.get('wall').length === 0 &&
                entitiesBehindCoordinates.get('pushable').length === 0 &&
                entitiesBehindCoordinates.get('walkable').length === 0
              ) {
                this.allEntities[
                  entitiesAtCoordinates.get('pushable')[i]
                ].moveEntity(
                  this.allEntities[entitiesAtCoordinates.get('pushable')[i]].x -
                    (this.player.x - x),
                  this.allEntities[entitiesAtCoordinates.get('pushable')[i]].y -
                    (this.player.y - y)
                );
                this.player.movePlayer(x, y);
              }
            }
          }
        } else {
          this.player.movePlayer(x, y);
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
    this.animateObjects([this.allEntities], this.player);
  }

  async ngAfterViewInit(): Promise<void> {
    let levelData = await import('../../assets/level_data/00.json');
    this.level = new Level(levelData.default);
    this.level.showData();
    this.ctx = this.mainCanvas.nativeElement.getContext('2d');
    let theight = this.cellSize * (Math.floor(innerHeight / this.cellSize) - 3);
    let twidth = this.cellSize * (Math.floor(innerWidth / this.cellSize) - 1);
    this.rows = Math.floor(theight / this.cellSize);
    this.cols = Math.floor(twidth / this.cellSize);
    let yPos = 0;
    for (let i = 0; i < this.letters.length; i++) {
      let xPos = i % this.cols;
      if (xPos === 0 && i !== 0) {
        yPos += 1;
      }
      if (this.letters[i] === 'x') {
        this.letterObjects[this.letters[i]] = new Letter(
          this.letters[i], //name
          5, //x position
          9, //y position
          this.cellSize,
          0,
          [
            'assets/images/' + this.letters[i] + '1.png',
            'assets/images/' + this.letters[i] + '2.png',
            'assets/images/' + this.letters[i] + '3.png',
          ], //frames
          true //is walkable
        );
      } else {
        this.letterObjects[this.letters[i]] = new Letter(
          this.letters[i], //name
          xPos, //x position
          yPos, //y position
          this.cellSize,
          0,
          [
            'assets/images/' + this.letters[i] + '1.png',
            'assets/images/' + this.letters[i] + '2.png',
            'assets/images/' + this.letters[i] + '3.png',
          ], //frames
          true //is walkable
        );
      }
    }
    this.allEntities = this.letterObjects;
    this.ctx.canvas.height = theight; //TODO : find a fix for the height & width issue
    this.ctx.canvas.width = twidth;
    this.drawGrid();
    this.ctx.fillStyle = 'red';
    this.ctx.beginPath();
    this.ctx.arc(
      this.player.x * this.cellSize + this.cellSize / 2,
      this.player.y * this.cellSize + this.cellSize / 2,
      this.cellSize / 2,
      0,
      2 * Math.PI
    );
    this.imgMap[this.player.name] = [];
    for (let i = 0; i < 3; i++) {
      this.imgMap[this.player.name].push(new Image());
      this.imgMap[this.player.name][i].src =
        'assets/images/' + this.player.name + (i + 1) + '.png';
    }
    this.ctx.fill();
    for (let i = 0; i < Object.keys(this.allEntities).length; i++) {
      this.imgMap[this.allEntities[this.letters[i]].name] = [];
      for (
        let j = 0;
        j < this.allEntities[this.letters[i]].sprites.length;
        j++
      ) {
        this.imgMap[this.allEntities[this.letters[i]].name].push(new Image());
        this.imgMap[this.allEntities[this.letters[i]].name][
          this.imgMap[this.allEntities[this.letters[i]].name].length - 1
        ].src = this.allEntities[this.letters[i]].sprites[j];
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
