import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';
import { GameHandlerComponent } from '../game-handler/game-handler.component';
import { HomePageRoutingModule } from './home-routing.module';
import { GameComponent } from '../game/game.component';
import { EditorComponent } from '../editor/editor.component';
@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HomePageRoutingModule],
  declarations: [HomePage, GameHandlerComponent, GameComponent, EditorComponent],//shouldn't have to import canvascomponent here, have to find how to avoid this later
})
export class HomePageModule {}
