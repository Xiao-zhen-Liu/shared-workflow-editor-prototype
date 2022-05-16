import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WorkflowEditorComponent} from "./workflow-editor.component";
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [
    WorkflowEditorComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    WorkflowEditorComponent
  ]
})
export class WorkflowEditorModule { }
