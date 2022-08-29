import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import Collectible from '../gameObjects/collectible';
import Entity from '../gameObjects/entity';
import Letter from '../gameObjects/letter';
import Level from '../gameObjects/level';
import { titleCaseWord } from '../misc/utils';
import { saveAs } from 'file-saver';
@Component({
  selector: 'editor-component',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  @ViewChild(IonModal)
  modal: IonModal;
  @ViewChild('letterModal')
  letterModal: IonModal;
  @ViewChild('editorCanvas')
  private editorCanvas: ElementRef = {} as ElementRef;
  public validationErrors: Record<string, Boolean> = {};
  private subscription: Subscription;
  private clockTick: number = 150;
  public level: Level;
  private initCellSize: number = 200;
  public selectedEraser: Boolean = false;
  private cellSize: number = 100;
  public recordedEntities: any = null;
  private ctx: CanvasRenderingContext2D;
  public currentFrame: number = 0;
  private missingTexturesImg: HTMLImageElement = new Image();
  public selectedKey: string = null;
  public selectedEntity: Entity = null;
  private eraserPos: [number, number] = [-1, -1];
  private dynamicDownload: HTMLElement = null;
  public selectedLetterKey: string = null;
  public selectedLetter: Letter = null;
  public allLetters: string = 'abcdefghijklmnopqrstuvwxyz';
  public imgMap: Map<string, Array<HTMLImageElement>> = new Map<
    string,
    Array<HTMLImageElement>
  >();
  public letterImgMap: Map<string, Array<HTMLImageElement>> = new Map<
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
  allLettersAsArray() {
    return this.allLetters.split('');
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

  selectLetter(letter: string) {
    this.selectedEraser = false;
    this.selectedEntity = null;
    this.selectedLetterKey = letter;
    this.selectedLetter = new Letter(
      letter,
      -1,
      -1,
      1,
      1,
      false,
      true,
      this.letterImgMap[letter]
    );
    this.letterModal.dismiss(null, 'Confirm');
  }

  selectEntity(entityKey: string) {
    this.selectedEraser = false;
    this.selectedLetter = null;
    this.selectedKey = entityKey;
    let entityParams: any = null;
    for (let [typeName, typeGroups] of Object.entries(this.recordedEntities)) {
      for (let e of Object.values(typeGroups)) {
        if (
          e['name'] &&
          this.selectedKey === e['name'] &&
          this.imgMap &&
          this.imgMap[this.selectedKey]
        ) {
          entityParams = e;
          entityParams.type = typeName;
        }
      }
    }
    if (['mobs', 'other', 'obstacles'].includes(entityParams.type)) {
      this.selectedEntity = new Entity(
        this.selectedKey,
        -1,
        -1,
        entityParams['size'],
        entityParams['layerValue'],
        entityParams['isWalkable'],
        entityParams['isPushable'],
        this.imgMap[this.selectedKey],
        entityParams?.kills,
        entityParams?.additionalProperties,
        entityParams?.aiName
      );
    } else if (entityParams.type === 'collectibles') {
      this.selectedEntity = new Collectible(
        this.selectedKey,
        -1,
        -1,
        entityParams['size'],
        entityParams['layerValue'],
        entityParams['isWalkable'],
        entityParams['isPushable'],
        this.imgMap[this.selectedKey],
        entityParams?.additionalProperties,
        true
      );
    }
    this.modal.dismiss(null, 'Confirm');
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
    this.validateErrors();
    this.level.name = e['value'];
  }

  doClick(e: Event) {
    if (this.selectedEntity) {
      if (this.selectedEntity.name === 'player') {
        this.level.player.x = Math.floor((e['layerX'] - 5) / this.cellSize);
        this.level.player.y = Math.floor(
          (e['layerY'] - this.cellSize / 2) / this.cellSize
        );
        this.selectedEntity = null;
        this.selectedKey = null;
        return;
      }
      for (let levelEntity of this.level.entitiesMinusPlayer()) {
        if (
          levelEntity.x === this.selectedEntity.x &&
          levelEntity.y === this.selectedEntity.y &&
          levelEntity.name === this.selectedEntity.name
        ) {
          return;
        }
      }
      let createdEntity: Entity = null;
      if (this.selectedEntity['isCollectible']) {
        createdEntity = new Collectible(
          this.selectedEntity.name,
          this.selectedEntity.x,
          this.selectedEntity.y,
          this.selectedEntity['size'],
          this.selectedEntity['layerValue'],
          this.selectedEntity['isWalkable'],
          this.selectedEntity['isPushable'],
          [
            'assets/images/entities/' + this.selectedEntity.name + '1.png',
            'assets/images/entities/' + this.selectedEntity.name + '2.png',
            'assets/images/entities/' + this.selectedEntity.name + '3.png',
          ],
          this.selectedEntity['additionalProperties'],
          true
        );
      } else {
        createdEntity = new Entity(
          this.selectedEntity.name,
          this.selectedEntity.x,
          this.selectedEntity.y,
          this.selectedEntity['size'],
          this.selectedEntity['layerValue'],
          this.selectedEntity['isWalkable'],
          this.selectedEntity['isPushable'],
          [
            'assets/images/entities/' + this.selectedEntity.name + '1.png',
            'assets/images/entities/' + this.selectedEntity.name + '2.png',
            'assets/images/entities/' + this.selectedEntity.name + '3.png',
          ],
          this.selectedEntity?.kills,
          this.selectedEntity['additionalProperties'],
          this.selectedEntity?.aiName
        );
      }

      this.level.entities.push(createdEntity);
    } else if (this.selectedLetter) {
      let createdLetter: Letter = null;
      createdLetter = new Letter(
        this.selectedLetter.name,
        this.selectedLetter.x,
        this.selectedLetter.y,
        this.selectedLetter['size'],
        this.selectedLetter['layerValue'],
        this.selectedLetter['isWalkable'],
        this.selectedLetter['isPushable'],
        [
          'assets/images/letters/' + this.selectedLetter.name + '1.png',
          'assets/images/letters/' + this.selectedLetter.name + '2.png',
          'assets/images/letters/' + this.selectedLetter.name + '3.png',
        ]
      );
      this.level.letters.push(createdLetter);
    } else if (this.selectedEraser) {
      let toBeDeletedEntity: Entity = null;
      for (let levelEntity of this.level.entitiesMinusPlayer()) {
        if (
          levelEntity.x === Math.floor((e['layerX'] - 5) / this.cellSize) &&
          levelEntity.y ===
            Math.floor((e['layerY'] - this.cellSize / 2) / this.cellSize)
        ) {
          toBeDeletedEntity = levelEntity;
        }
      }
      if (toBeDeletedEntity) {
        if (this.level.entities.includes(toBeDeletedEntity)) {
          this.level.entities.splice(
            this.level.entities.indexOf(toBeDeletedEntity),
            1
          );
        } else if (this.level.letters.includes(toBeDeletedEntity as Letter)) {
          this.level.letters.splice(
            this.level.letters.indexOf(toBeDeletedEntity as Letter),
            1
          );
        }
      }
    } else {
      if (
        this.level.player.x === Math.floor((e['layerX'] - 5) / this.cellSize) &&
        this.level.player.y ===
          Math.floor((e['layerY'] - this.cellSize / 2) / this.cellSize)
      ) {
        this.selectedEntity = this.level.player;
        this.selectedKey = this.level.player.name;
        //not strictly needed but helps a little to prevent glitches
        this.selectedLetter = null;
        this.selectedLetterKey = null;
      }
    }
  }

  mouseMove(e: Event) {
    //item selection, not yet implemented
    if (
      this.selectedEntity &&
      Math.floor((e['layerX'] - 5) / this.cellSize) < this.level.sizeX &&
      Math.floor((e['layerY'] - this.cellSize / 2) / this.cellSize) <
        this.level.sizeY
    ) {
      this.selectedEntity.x = Math.floor((e['layerX'] - 5) / this.cellSize);
      this.selectedEntity.y = Math.floor(
        (e['layerY'] - this.cellSize / 2) / this.cellSize
      );
    } else if (
      this.selectedLetter &&
      Math.floor((e['layerX'] - 5) / this.cellSize) < this.level.sizeX &&
      Math.floor((e['layerY'] - this.cellSize / 2) / this.cellSize) <
        this.level.sizeY
    ) {
      this.selectedLetter.x = Math.floor((e['layerX'] - 5) / this.cellSize);
      this.selectedLetter.y = Math.floor(
        (e['layerY'] - this.cellSize / 2) / this.cellSize
      );
    } else if (this.selectedEraser) {
      this.eraserPos = [
        Math.floor((e['layerX'] - 5) / this.cellSize),
        Math.floor((e['layerY'] - this.cellSize / 2) / this.cellSize),
      ];
    }
  }
  selectEraser() {
    this.selectedEntity = null;
    this.selectedKey = null;
    this.selectedLetter = null;
    this.selectedLetterKey = null;
    this.selectedEraser = !this.selectedEraser;
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
    this.selectedEntity = null;
  }

  confirm() {
    //to complete for entity selection
    this.modal.dismiss(null, 'Confirm');
  }
  cancelLetters() {
    this.letterModal.dismiss('letterModal', 'cancel');
    this.selectedLetterKey = null;
    this.selectedLetter = null;
  }

  confirmLetters() {
    //to complete for entity selection
    this.letterModal.dismiss(null, 'Confirm');
  }
  onWillDismissLetter(event: Event) {
    //to complete for entity deselection
  }
  onWillDismiss(event: Event) {
    //to complete for entity deselection
  }
  setupImgMap() {
    for (let letter of 'abcdefghijklmnopqrstuvwxyz') {
      this.letterImgMap[letter] = [];
      for (let i = 0; i < 3; i++) {
        this.letterImgMap[letter].push(new Image());
        this.letterImgMap[letter][this.letterImgMap[letter].length - 1].src =
          'assets/images/letters/' + letter + (i + 1) + '.png';
      }
    }

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

  validateErrors() {
    if (!this.level.name || this.level.name.length < 1) {
      this.validationErrors['name'] = true;
    } else {
      delete this.validationErrors['name'];
    }
    if (!this.level.sizeX || this.level.sizeX < 4) {
      this.validationErrors['sizeX'] = true;
    } else {
      delete this.validationErrors['sizeX'];
    }
    if (!this.level.sizeY || this.level.sizeY < 4) {
      this.validationErrors['sizeY'] = true;
    } else {
      delete this.validationErrors['sizeY'];
    }
    if (
      !this.level.player ||
      this.level.player.x < 0 ||
      this.level.player.y < 0 ||
      this.level.player.x >= this.level.sizeX ||
      this.level.player.y >= this.level.sizeY
    ) {
      this.validationErrors['player'] = true;
    } else {
      delete this.validationErrors['player'];
    }
    if (
      (!this.level.letters || this.level.letters.length === 0) &&
      (!this.level.entities || this.level.entities.length === 0)
    ) {
      this.validationErrors['entities'] = true;
    } else {
      delete this.validationErrors['entities'];
    }
  }

  exportLevel() {
    this.validateErrors();
    if (Object.keys(this.validationErrors).length === 0) {
      var blob = new Blob([JSON.stringify(this.level.exportAsJSON())], {
        type: 'text/json;charset=utf-8',
      });
      saveAs(blob, this.level.name + '.json');
    } else {
      console.log(this.validationErrors);
    }
  }
  animateObjects(entityArray: Array<Entity>): void {
    if (this.selectedEntity && this.imgMap[this.selectedEntity.name]) {
      this.ctx.globalAlpha = 0.4;
      this.ctx.drawImage(
        this.imgMap[this.selectedEntity.name][this.selectedEntity.frame],
        this.selectedEntity.x * this.cellSize,
        this.selectedEntity.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      this.selectedEntity.updateFrame();
    } else if (this.selectedLetter) {
      this.ctx.globalAlpha = 0.4;
      this.ctx.drawImage(
        this.letterImgMap[this.selectedLetter.name][this.selectedLetter.frame],
        this.selectedLetter.x * this.cellSize,
        this.selectedLetter.y * this.cellSize,
        this.cellSize,
        this.cellSize
      );
      this.selectedLetter.updateFrame();
    } else if (this.selectedEraser) {
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(
        this.eraserPos[0] * this.cellSize,
        this.eraserPos[1] * this.cellSize,
        this.cellSize,
        this.cellSize
      );
    }
    this.ctx.globalAlpha = 1;
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
          if (entity instanceof Letter) {
            this.ctx.drawImage(
              this.letterImgMap[entity.name][entity.frame],
              entity.x * this.cellSize,
              entity.y * this.cellSize,
              this.cellSize,
              this.cellSize
            );
          } else {
            this.ctx.drawImage(
              this.imgMap[entity.name][entity.frame],
              entity.x * this.cellSize,
              entity.y * this.cellSize,
              this.cellSize,
              this.cellSize
            );
          }
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
