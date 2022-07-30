import { Component, NgModule, OnInit } from '@angular/core';
import { CanvasComponent } from '../canvas/canvas.component';
// import { IonicModule } from '@ionic/angular';
// import { CommonModule } from '@angular/common'; 
// import { FormsModule } from '@angular/forms';

@Component({
  selector: 'game-engine-component',
  templateUrl: './game-engine.component.html',
  styleUrls: ['./game-engine.component.scss'],
})

@NgModule({
  // imports: [IonicModule, CommonModule, FormsModule],
  declarations:[CanvasComponent],
})
export class GameEngineComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
