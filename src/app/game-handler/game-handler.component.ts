import { Component, NgModule, OnInit } from '@angular/core';
import { CanvasComponent } from '../canvas/canvas.component';
// import { IonicModule } from '@ionic/angular';
// import { CommonModule } from '@angular/common'; 
// import { FormsModule } from '@angular/forms';

@Component({
  selector: 'game-handler-component',
  templateUrl: './game-handler.component.html',
  styleUrls: ['./game-handler.component.scss'],
})

@NgModule({
  // imports: [IonicModule, CommonModule, FormsModule],
  declarations:[CanvasComponent],
})
export class GameHandlerComponent implements OnInit {

  constructor() { }

  ngOnInit() {}

}
