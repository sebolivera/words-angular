import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import Player from '../gameObjects/player';
import Entity from '../gameObjects/entity';
import { HostListener } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'canvas-component',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvas')
  private mainCanvas: ElementRef = {} as ElementRef;
  private subsciption: Subscription;
  private cellSize: number = 25;
  ctx: CanvasRenderingContext2D;
  private player: Player;
  private clockTick: number = 100; //arbitrary af
  private letterObjects: Map<string, Entity> = new Map<string, Entity>();
  private letters: string = 'abcdefghijklmnopqrstuvwxyz';
  private rows: number;
  private cols: number;
  private imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  constructor() {
    this.player = new Player(5, 10, this.cellSize, 'red');
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

  animateObjects(entities: Map<string, Entity>): void {
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
  }

  animatePlayer(x: number, y: number): void {
    //moves the player, erases the last position, and redraws the grid

    this.ctx.beginPath();
    this.ctx.fillStyle = 'red';
    this.ctx.arc(
      this.player.x * this.cellSize + this.cellSize / 2,
      this.player.y * this.cellSize + this.cellSize / 2,
      this.cellSize / 2,
      0,
      2 * Math.PI
    );
    this.ctx.stroke();
    this.ctx.fill();
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
      this.player.movePlayer(x, y);
      this.animatePlayer(oldX, oldY);
    }
  }

  animate()
  {
    this.ctx.lineWidth = 0;
    this.ctx.beginPath();
    this.ctx.fillStyle = 'white';
    this.ctx.rect(
      0,
      0,
      this.mainCanvas.nativeElement.width,
      this.mainCanvas.nativeElement.height,
    );
    this.ctx.fill();
    this.drawGrid();//grid is behind everything else
    this.animateObjects(this.letterObjects);
    this.animatePlayer(this.player.x, this.player.y);
  }

  ngAfterViewInit(): void {
    this.ctx = this.mainCanvas.nativeElement.getContext('2d');
    let theight = this.cellSize * (Math.floor(innerHeight / this.cellSize) - 3);
    let twidth = this.cellSize * (Math.floor(innerWidth / this.cellSize) - 1);
    this.rows = Math.floor(theight / this.cellSize);
    this.cols = Math.floor(twidth / this.cellSize);
    console.log(this.rows, this.cols)
    let yPos = 0;
    for (let i = 0; i < this.letters.length; i++) {
      let xPos = i % this.cols;
      if (xPos === 0 && i !== 0) {
        yPos += 1;
      }
      this.letterObjects[this.letters[i]] = new Entity(
        this.letters[i],
        xPos,
        yPos,
        this.cellSize,
        [
          'assets/images/' + this.letters[i] + '1.png',
          'assets/images/' + this.letters[i] + '2.png',
          'assets/images/' + this.letters[i] + '3.png',
        ]
      );
    }
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
    this.ctx.fill();
    for (let i = 0; i < Object.keys(this.letterObjects).length; i++) {
      this.imgMap[this.letterObjects[this.letters[i]].name] = [];
      for (
        let j = 0;
        j < this.letterObjects[this.letters[i]].sprites.length;
        j++
      ) {
        this.imgMap[this.letterObjects[this.letters[i]].name].push(new Image());
        this.imgMap[this.letterObjects[this.letters[i]].name][
          this.imgMap[this.letterObjects[this.letters[i]].name].length - 1
        ].src = this.letterObjects[this.letters[i]].sprites[j];
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
