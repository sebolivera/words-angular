import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { GameEngineComponent } from '../game-engine/game-engine.component';
import { HomePageRoutingModule } from './home-routing.module';
import { CanvasComponent } from '../canvas/canvas.component';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule],
  declarations: [HomePage, GameEngineComponent, CanvasComponent],//shouldn't have to import canvascomponent here, have to find how to avoid this later
})
export class HomePageModule {}
