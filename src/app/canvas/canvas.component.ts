import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'canvas-component',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('mainCanvas')
  public mainCanvas: ElementRef = {} as ElementRef;
  ngAfterViewInit(): void {
    this.mainCanvas = this.mainCanvas.nativeElement.getContext('2d');
  }

}
