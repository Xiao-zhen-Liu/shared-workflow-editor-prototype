import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { WorkflowEditorModule } from "./component/workflow-editor/workflow-editor.module";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    WorkflowEditorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
