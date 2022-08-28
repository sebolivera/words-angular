import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { OverlayEventDetail } from '@ionic/core';
import { Subscription, timer } from 'rxjs';
import Entity from '../gameObjects/entity';
import Level from '../gameObjects/level';
import { titleCaseWord } from '../misc/utils';
@Component({
  selector: 'editor-component',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  @ViewChild(IonModal)
  modal: IonModal;
  @ViewChild('editorCanvas')
  private editorCanvas: ElementRef = {} as ElementRef;
  private subscription: Subscription;
  private clockTick: number = 150;
  public level: Level;
  private initCellSize: number = 200;
  private cellSize: number = 100;
  public recordedEntities: any = null;
  private ctx: CanvasRenderingContext2D;
  public currentFrame: number = 0;
  private missingTexturesImg: HTMLImageElement = new Image();
  public selectedKey: string = null;
  public imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  constructor() {
    this.missingTexturesImg.src =
      '../assets/images/entities/missingTextures.png';
  }
  titleCaseWord(word: any) {
    return titleCaseWord(word as string);
  }
  animate() {
    this.currentFrame = (this.currentFrame += 1) % 3;
    this.ctx.lineWidth = 0;
    this.ctx.beginPath();
    this.ctx.fillStyle = 'white';
    this.ctx.rect(
      0,
      0,
      this.editorCanvas.nativeElement.width,
      this.editorCanvas.nativeElement.height
    );
    this.ctx.fill();
    this.drawGrid(); //grid is behind everything else
    this.animateObjects(this.level.entitiesAndPlayer());
  }
  setLevelsizeX(e: EventTarget) {
    this.level.sizeX = e['value'];
    this.refreshCanvas();
  }
  setLevelsizeY(e: EventTarget) {
    this.level.sizeY = e['value'];
    this.refreshCanvas();
  }
  selectEntity(entityKey: string) {
    this.selectedKey = entityKey;
    console.log(this.selectedKey);
  }
  refreshCanvas() {
    this.reCalculateTableDimensions();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawGrid();
  }

  ngOnInit(): void {}

  reCalculateTableDimensions() {
    let cellHeight: number = this.initCellSize;
    let safetyCounter: number = 0;
    // Optimization for the grid size, not strictly needed but eh, looks cool

    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY < this.ctx.canvas.height
    ) {
      cellHeight *= 1.1; //somehow giving this more precision makes the grid overflow to to the bottom...?
      safetyCounter += 1;
    }
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY > this.ctx.canvas.height
    ) {
      cellHeight *= 0.9; //somehow giving this more precision makes the grid overflow to to the bottom...?
      safetyCounter += 1;
    }
    let cellWidth = Math.floor(cellHeight);
    safetyCounter = 0;

    while (
      safetyCounter < 100 &&
      cellWidth * this.level.sizeX < this.ctx.canvas.width
    ) {
      cellWidth *= 1.1;
      safetyCounter += 1;
    }
    while (
      safetyCounter < 100 &&
      cellWidth * this.level.sizeX > this.ctx.canvas.width
    ) {
      cellWidth *= 0.9;
      safetyCounter += 1;
    }
    this.cellSize = Math.floor(cellWidth < cellHeight ? cellWidth : cellHeight);
  }
  pinFormatterX(value: number) {
    return `${value}`;
  }
  pinFormatterY(value: number) {
    return `${value}`;
  }
  reCalculateCanvasSize() {
    let cellHeight: number = this.initCellSize;
    let safetyCounter: number = 0;
    // Optimization for the grid size, not strictly needed but eh, looks cool
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY > window.innerHeight - cellHeight * 2
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
    let theight = this.cellSize * this.level.sizeY;
    let twidth = this.cellSize * this.level.sizeX;
    this.ctx.canvas.height = theight; //canvas overflows a little bit to the bottom because of the titles etc. TODO: change how that works
    this.ctx.canvas.width = twidth;

    this.drawGrid();
  }
  setName(e: EventTarget) {
    this.level.name = e['value'];
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

  drawGrid(): void {
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.font = '10px serif';
    if (this.cellSize > 0) {
      for (
        let i = 0;
        i <= this.level.sizeX * this.cellSize;
        i += this.cellSize
      ) {
        this.ctx.moveTo(i, 0);
        this.ctx.strokeStyle = '#cccccc';
        if (
          this.level?.debug &&
          (this.level.sizeX - 1) * this.cellSize &&
          i <= (this.level.sizeX - 1) * this.cellSize
        ) {
          this.ctx.fillStyle = 'blue';
          this.ctx.fillText((i / this.cellSize).toString(), i, 10);
        }
        this.ctx.lineTo(i, this.level.sizeY * this.cellSize);
      }
      for (
        let i = 0;
        i <= this.level.sizeY * this.cellSize;
        i += this.cellSize
      ) {
        if (
          this.level?.debug &&
          (this.level.sizeY - 1) * this.cellSize &&
          i <= (this.level.sizeY - 1) * this.cellSize
        ) {
          this.ctx.fillStyle = 'red';
          this.ctx.fillText((i / this.cellSize).toString(), 0, i + 10);
        }
        this.ctx.moveTo(0, i);
        this.ctx.strokeStyle = '#cccccc';
        this.ctx.lineTo(this.level.sizeX * this.cellSize, i);
      }
    }
    this.ctx.stroke();
    this.ctx.closePath();
  }
  cancel() {
    this.modal.dismiss(null, 'cancel');
    this.selectedKey = null;
  }

  confirm() {
    //to complete for entity selection
    this.modal.dismiss(null, 'Confirm');
  }
  onWillDismiss(event: Event) {
    //to complete for entity deselection
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    if (ev.detail.role === 'confirm') {
      console.log('Modal dismissed');
    }
  }
  doClick(e: Event) {
    console.log(e['layerX'], e['layerY']);
  }
  setupImgMap() {
    for (let type of Object.values(this.recordedEntities)) {
      for (let entity of Object.values(type)) {
        if (entity && entity['name'] && entity['name'].length > 0) {
          this.imgMap[entity['name']] = [];
          for (let i = 1; i <= 3; i++) {
            this.imgMap[entity['name']].push(new Image());
            this.imgMap[entity['name']][
              this.imgMap[entity['name']].length - 1
            ].src = 'assets/images/entities/' + entity['name'] + i + '.png';
          }
        }
      }
    }
    this.imgMap['player'] = [new Image(), new Image(), new Image()];

    for (let i = 0; i < this.imgMap['player'].length; i++) {
      this.imgMap['player'][i].src =
        'assets/images/player/player' + (i + 1) + '.png';
    }
  }

  animateObjects(entityArray: Array<Entity>): void {
    entityArray.forEach((entity) => {
      if (entity.name === 'player') {
        this.ctx.drawImage(
          this.imgMap['player'][entity.frame],
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
  async ngAfterViewInit(): Promise<void> {
    let levelData = await import('../../assets/level_data/template_level.json');
    this.recordedEntities = await import(
      '../../assets/entityData/entities.json'
    );
    this.setupImgMap();
    this.ctx = this.editorCanvas.nativeElement.getContext('2d');
    this.level = new Level(levelData.default);

    this.reCalculateCanvasSize();
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
