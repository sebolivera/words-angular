import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'game-handler-component',
  templateUrl: './game-handler.component.html',
  styleUrls: ['./game-handler.component.scss'],
})

export class GameHandlerComponent implements OnInit {
  public currentPage:string = "editor";
  constructor() { }
  switchTo(location:string)
  {
    console.log('Clicked!')
    this.currentPage = location;
  }
  ngOnInit() {}

}
