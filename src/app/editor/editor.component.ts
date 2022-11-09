import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonInput, IonModal, IonRange } from '@ionic/angular';
import { Subscription, timer } from 'rxjs';
import Entity from '../gameObjects/entity';
import Letter from '../gameObjects/letter';
import Level from '../gameObjects/level';
import { titleCaseWord } from '../misc/utils';
import { AlertController } from '@ionic/angular';
import { saveAs } from 'file-saver';
import { defineCustomElements } from '@ionic/pwa-elements/loader';
@Component({
  selector: 'editor-component',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  @ViewChild('nameInput')
  defaultInputName: IonInput;
  @ViewChild('descInput')
  defaultInputDesc: IonInput;
  @ViewChild(IonModal)
  modal: IonModal;
  @ViewChild('letterModal')
  letterModal: IonModal;
  @ViewChild('editorCanvas')
  private editorCanvas: ElementRef = {} as ElementRef;
  @ViewChild('rangeX')
  rangeX: IonRange;
  @ViewChild('rangeY')
  rangeY: IonRange;
  public localStorageLevelAvailable: Boolean = false;
  public validationErrors: Record<string, Boolean> = {};
  private subscription: Subscription;
  private clockTick: number = 150;
  public level: Level;
  public storedLevels: Record<string, any> = {};
  private initCellSize: number = 200;
  public selectedEraser: Boolean = false;
  private cellSize: number = 100;
  public searchTerm: string = '';
  public recordedEntities: any = null;
  public searchSafeRecordedEntities: any = null;
  private ctx: CanvasRenderingContext2D;
  private firstLoad: Boolean = true;
  public defaultName: string;
  public currentFrame: number = 0;
  private missingTexturesImg: HTMLImageElement = new Image();
  public selectedKey: string = null;
  public selectedEntity: Entity = null;
  private eraserPos: [number, number];
  public selectedLetterKey: string = null;
  public selectedLetter: Letter = null;
  public allLetters: string = 'abcdefghijklmnopqrstuvwxyz';
  public imgMap: Map<string, Array<HTMLImageElement>>;
  public letterImgMap: Map<string, Array<HTMLImageElement>>;
  public savedLevelKeys: Array<string> = [];
  constructor(private alertController: AlertController) {
    defineCustomElements(window);
    this.missingTexturesImg.src =
      '../assets/images/entities/missingTextures.png';
  }
  titleCaseWord(word: any) {
    return titleCaseWord(word as string);
  }
  allLettersAsArray() {
    return this.allLetters.split('');
  }
  async resetEditor() {
    const alert = await this.alertController.create({
      header: 'WAIT!',
      message: 'Are you sure you want to discard all the changes you made?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'cancelAlertButton',
          handler: () => {},
        },
        {
          text: 'Confirm',
          role: 'confirm',
          cssClass: 'confirmAlertButton',
          handler: async () => {
            await this.reset();
          },
        },
      ],
    });
    await alert.present();
  }

  async reset() {
    this.subscription.unsubscribe();
    await this.ngAfterViewInit();
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
    this.animateObjects();
  }
  setLevelsizeX(e: EventTarget) {
    this.level.sizeX = e['value'];
    if (this.level.player.x >= this.level.sizeX) {
      this.level.player.x = this.level.sizeX - 1;
    }
    this.refreshCanvas();
  }

  deselectAll() {
    this.selectedEraser = false;
    this.selectedEntity = null;
    this.selectedLetter = null;
  }

  setLevelsizeY(e: EventTarget) {
    this.level.sizeY = e['value'];
    if (this.level.player.y >= this.level.sizeY) {
      this.level.player.y = this.level.sizeY - 1;
    }
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
    if (
      ['mobs', 'other', 'obstacles', 'collectibles', 'vehicles'].includes(
        entityParams.type
      )
    ) {
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
        entityParams?.ai,
        entityParams['isCollectible'],
        null,
        true
      );
    }
    this.modal.dismiss(null, 'Confirm');
  }
  refreshCanvas() {
    this.recalculateTableDimensions();
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawGrid();
  }

  ngOnInit(): void {}

  recalculateTableDimensions() {
    let cellHeight: number = this.initCellSize;
    let safetyCounter: number = 0;

    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY < this.ctx.canvas.height
    ) {
      cellHeight *= 1.1;
      safetyCounter += 1;
    }
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY > this.ctx.canvas.height
    ) {
      cellHeight *= 0.9;
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
  recalculateCanvasSize() {
    let cellHeight: number = this.initCellSize;
    let safetyCounter: number = 0;
    while (
      safetyCounter < 100 &&
      cellHeight * this.level.sizeY > window.innerHeight - cellHeight * 2
    ) {
      cellHeight *= 0.9;
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
    this.ctx.canvas.height = theight;
    this.ctx.canvas.width = twidth;

    this.drawGrid();
  }
  setDesc(e: EventTarget) {
    this.level.description = e['value'];
  }

  setName(e: EventTarget) {
    this.level.name = e['value'];
  }

  doClick(e: Event) {
    let rect = this.ctx.canvas.getBoundingClientRect();
    if (this.selectedEntity) {
      if (this.selectedEntity.name === 'player') {
        this.level.player.x = Math.floor(
          (e['clientX'] - rect.left) / this.cellSize
        );
        this.level.player.y = Math.floor(
          (e['clientY'] - rect.top) / this.cellSize
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
        this.selectedEntity?.ai,
        this.selectedEntity['isCollectible'],
        null,
        true
      );

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
          levelEntity.x ===
            Math.floor((e['clientX'] - rect.left) / this.cellSize) &&
          levelEntity.y ===
            Math.floor((e['clientY'] - rect.top) / this.cellSize)
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
        this.level.player.x ===
          Math.floor((e['clientX'] - rect.left) / this.cellSize) &&
        this.level.player.y ===
          Math.floor((e['clientY'] - rect.top) / this.cellSize)
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
    let rect = this.ctx.canvas.getBoundingClientRect();
    if (
      this.selectedEntity &&
      Math.floor((e['clientX'] - rect.left) / this.cellSize) <
        this.level.sizeX &&
      Math.floor((e['clientY'] - rect.top) / this.cellSize) < this.level.sizeY
    ) {
      this.selectedEntity.x = Math.floor(
        (e['clientX'] - rect.left) / this.cellSize
      );
      this.selectedEntity.y = Math.floor(
        (e['clientY'] - rect.top) / this.cellSize
      );
    } else if (
      this.selectedLetter &&
      Math.floor((e['clientX'] - rect.left)/this.cellSize) < this.level.sizeX &&
      Math.floor((e['clientY'] - rect.top) / this.cellSize) < this.level.sizeY
    ) {
      this.selectedLetter.x = Math.floor(
        (e['clientX'] - rect.left) / this.cellSize
      );
      this.selectedLetter.y = Math.floor(
        (e['clientY'] - rect.top) / this.cellSize
      );
    } else if (this.selectedEraser) {
      this.eraserPos = [
        Math.floor((e['clientX'] - rect.left) / this.cellSize),
        Math.floor((e['clientY'] - rect.top) / this.cellSize),
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
    if (!this.firstLoad){
    this.ctx.font = 'regular 10px serif';}
    if (this.cellSize > 0) {
      for (
        let i = 0;
        i <= this.level.sizeX * this.cellSize;
        i += this.cellSize
      ) {
        this.ctx.moveTo(i, 0);
        this.ctx.strokeStyle = '#cccccc';
        if (
          this.level?.debug && !this.firstLoad &&
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
          this.level?.debug && !this.firstLoad && 
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

  confirmLevel() {}
  cancelLevel() {}

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
      var blob = new Blob([JSON.stringify(this.level.JSONSerialize())], {
        type: 'text/json;charset=utf-8',
      });
      saveAs(blob, this.level.name + '.json');
    }
  }

  saveToLocalStorage() {
    //TODO: safeguard for levels with the same name?
    this.validateErrors();
    if (Object.keys(this.validationErrors).length === 0) {
      if (Object.keys(this.validationErrors).length === 0) {
        if (localStorage.length !== 0 && localStorage.getItem('levels')) {
          for (let [key, value] of Object.entries(
            localStorage.getItem('levels')
          )) {
            if (key === this.level.name) {
              localStorage.removeItem(this.level.name);
            }
          }
        }
        let levels: Record<string, any>;

        if (
          'levels' in localStorage &&
          localStorage.getItem('levels') &&
          localStorage.getItem('levels') !== 'undefined'
        ) {
          levels = JSON.parse(localStorage.getItem('levels'));
          levels[this.level.name] = this.level.JSONSerialize();
        } else {
          levels = { [this.level.name]: this.level.JSONSerialize() };
        }
        localStorage.setItem('levels', JSON.stringify(levels));
        this.localStorageLevelAvailable = true;
      }
    }
    this.grabLocalStorageLevels();
  }

  animateObjects(): void {
    let entityArray: Array<Entity> = this.level.entitiesAndPlayer();
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
      if (!entity.frame) {
        entity.frame = 0;
      }
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

  async deleteStoredLevel(levelKey: string) {
    const alert = await this.alertController.create({
      header: 'Delete stored level?',
      message: 'Are you sure you want to delete the level?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'cancelAlertButton',
          handler: () => {},
        },
        {
          text: 'Confirm',
          role: 'confirm',
          cssClass: 'confirmAlertButton',
          handler: () => {
            let tempStoredLevels = JSON.parse(localStorage.getItem('levels'));
            if (
              localStorage.getItem('levels') &&
              localStorage.getItem('levels') !== 'undefined'
            ) {
              this.storedLevels = [];
              this.savedLevelKeys = [];
              for (let [key, value] of Object.entries(tempStoredLevels)) {
                if (key !== levelKey) {
                  this.storedLevels[key] = value;
                  this.savedLevelKeys.push(key);
                }
              }

              delete tempStoredLevels[levelKey];
              localStorage.setItem('levels', JSON.stringify(tempStoredLevels));
              this.localStorageLevelAvailable = true;
            }
            this.checkLocalStorage();
          },
        },
      ],
    });
    await alert.present();
  }
  async selectLoadedLevel(key: string) {
    await this.reset();
    this.level.levelFromObject(this.storedLevels[key]);
    this.rangeX.value = this.level.sizeX;
    this.rangeY.value = this.level.sizeY;
    this.defaultInputName.value = this.level.name;
    this.defaultInputDesc.value = this.level.description;
    this.validateErrors();
    this.setupImgMap();
  }
  setSearchTerm(t: EventTarget) {
    this.searchSafeRecordedEntities = {};
    for (let [keyCat, valueCat] of Object.entries(
      this.recordedEntities.default
    )) {
      if (keyCat.includes(t['value'])) {
        this.searchSafeRecordedEntities[keyCat] = valueCat;
      } else {
        for (let [key, value] of Object.entries(valueCat)) {
          if (
            key.includes(t['value']) ||
            (value['verboseName'] &&
              value['verboseName'].includes(t['value'])) ||
            (value['description'] && value['description'].includes(t['value']))
          ) {
            if (keyCat in this.searchSafeRecordedEntities) {
              this.searchSafeRecordedEntities[keyCat][key] = value;
            } else {
              this.searchSafeRecordedEntities[keyCat] = {};
              this.searchSafeRecordedEntities[keyCat][key] = value;
            }
          }
        }
      }
    }
  }
  importLevelFromJSON(JSONData: JSON) {
    this.level.levelFromObject(JSONData);
    this.rangeX.value = this.level.sizeX;
    this.rangeY.value = this.level.sizeY;
    this.defaultInputName.value = this.level.name;
    this.defaultInputDesc.value = this.level.description;
    this.recalculateCanvasSize();
  }

  importLevel(eTarget: EventTarget) {
    if (eTarget['files'].length > 0) {
      const fileReader = new FileReader();
      fileReader.readAsText(eTarget['files'][0], 'UTF-8');
      fileReader.onload = () => {
        this.importLevelFromJSON(JSON.parse(fileReader.result as string));
      };
      fileReader.onerror = (error) => {
        console.error('Level was imporperly uploaded. Is the file too large?');
      };
    }
  }

  checkLocalStorage() {
    if (
      !localStorage.getItem('levels') ||
      localStorage.getItem('levels').length === 0 ||
      localStorage.getItem('levels') === 'undefined' ||
      localStorage.getItem('levels') === '{}'
    ) {
      localStorage.removeItem('levels');
      this.localStorageLevelAvailable = false;
    } else {
      this.localStorageLevelAvailable = true;
    }
  }

  grabLocalStorageLevels() {
    if (
      localStorage.getItem('levels') &&
      localStorage.getItem('levels').length !== 0 &&
      localStorage.getItem('levels') !== '{}' &&
      localStorage.getItem('levels') !== 'undefined'
    ) {
      this.storedLevels = [];
      let tempSavedLevelKeys: Array<string> = [];
      let tempStoredLevels = JSON.parse(localStorage.getItem('levels'));
      for (let [key, value] of Object.entries(tempStoredLevels)) {
        this.storedLevels[key] = value;
        tempSavedLevelKeys.push(key);
      }
      this.savedLevelKeys = tempSavedLevelKeys.sort();
    }
    this.checkLocalStorage();
  }

  async ngAfterViewInit(): Promise<void> {
    this.defaultInputName.value = '';
    this.defaultInputDesc.value = '';
    this.imgMap = new Map<string, Array<HTMLImageElement>>();
    this.letterImgMap = new Map<string, Array<HTMLImageElement>>();
    this.eraserPos = [-1, -1];
    this.selectedEntity = null;
    this.selectedKey = null;
    this.selectedLetter = null;
    this.selectedLetterKey = null;
    this.rangeX.value = 10;
    this.rangeY.value = 10;
    let levelData = await import('../../assets/level_data/template_level.json');
    this.recordedEntities = await import(
      '../../assets/entityData/entities.json'
    );
    this.searchSafeRecordedEntities = { ...this.recordedEntities.default };
    this.setupImgMap();
    this.ctx = this.editorCanvas.nativeElement.getContext('2d');
    this.level = new Level(levelData.default);

    this.recalculateCanvasSize();
    this.subscription = timer(0, this.clockTick)
      .pipe()
      .subscribe(() => {
        this.animate();
      });
    Object.keys(this.validationErrors).forEach(
      (key) => delete this.validationErrors[key]
    );
    this.grabLocalStorageLevels();
    this.firstLoad = false;
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
