import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'game-handler-component',
  templateUrl: './game-handler.component.html',
  styleUrls: ['./game-handler.component.scss'],
})

export class GameHandlerComponent implements OnInit {
  public currentPage:string = "level";
  constructor() { }
  switchTo(location:string)
  {
    this.currentPage = location;
  }
  ngOnInit() {}

}
