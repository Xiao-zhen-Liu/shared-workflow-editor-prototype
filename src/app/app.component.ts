import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  readOnly = false;
  scaleValue = 1.0;

  inputData!: string;
  title: string = 'Shared Workflow Editor Prototype';

  scale(value: number) {
    this.scaleValue = this.scaleValue + value;
  }
}
