import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as joint from 'jointjs';
import {g} from 'jointjs';
import {YService} from '../../service/y/y.service';
import {WorkflowActionService} from '../../service/workflow-graph/workflow-action.service';
import {fromEvent} from 'rxjs';
import {JointUIService} from '../../service/joint-ui/joint-ui.service';
import {QuillBinding} from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import {YMap} from "yjs/dist/src/types/YMap";
import MouseMoveEvent = JQuery.MouseMoveEvent;
import MouseLeaveEvent = JQuery.MouseLeaveEvent;
import MouseEnterEvent = JQuery.MouseEnterEvent;
import Point = g.Point;

/**
 * The main component of the prototype.
 */
@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss']
})
export class WorkflowEditorComponent implements OnInit {

  textContent = 'Disconnect';
  editEnabled = true;
  graph!: joint.dia.Graph;
  paper!: joint.dia.Paper;
  @Output() modelSelected = new EventEmitter();
  readOnlyValue = true;
  scaleValue = 1.0;
  inputData!: string;
  quillBinding!: QuillBinding;
  quill!: Quill;

  get readOnly(): boolean {
    return this.readOnlyValue;
  }

  @Input()
  set readOnly(value: boolean) {
    this.readOnlyValue = value;
    if (this.paper) {
      this.paper.setInteractivity(!this.readOnly);
    }
  }

  get scale(): number {
    return this.scaleValue;
  }

  @Input()
  set scale(value: number) {
    this.scaleValue = value;
    if (this.paper) {
      this.paper.scale(this.scale);
    }
  }

  constructor(private yService: YService,
              private workflowActionService: WorkflowActionService) {
  }

  /**
   * Until 'synced' of the dbProvider, yjs would not be able to read the persisted data, so everything should be done
   * on 'synced'.
   */
  ngOnInit() {
    this.yService.dbProvider.on('synced', () => {
      this.initializeCanvas();
      this.workflowActionService.loadJointGraphFromYTexeraGraph();
      this.handlePointerEvents();

      // Property editor
      Quill.register('modules/cursors', QuillCursors);
      this.quill = new Quill(document.querySelector('#propertyEditor') as Element, {
        modules: {
          cursors: true,
          toolbar: [],
          history: {
            // Local undo shouldn't undo changes
            // from remote users
            userOnly: true
          }
        },
        placeholder: 'Start collaborating...',
        theme: 'snow'
      })
    })
  }

  /**
   * Creates the jointjs canvas and specifies event actions.
   */
  initializeCanvas() {
    this.paper = new joint.dia.Paper({
      el: document.getElementById("paper-container") as HTMLElement,
      model: this.workflowActionService.jointGraph,
      width: 8000,
      height: 5000,
      gridSize: 1,
      linkPinning: false,
      defaultLink: JointUIService.getDefaultLinkCell(),
      markAvailable: true,
    });
    this.paper.setInteractivity(!this.readOnly);
    this.paper.scale(this.scale);
    this.paper.on('link:pointerdblclick', link => {
      console.log(link);
    });

    this.paper.on('element:pointerdblclick', element => {
      this.workflowActionService.deleteModelOperator(element.model.id.toString());
    });

    this.paper.on('element:pointerclick', element => {
      if (this.quillBinding) this.quillBinding.destroy();
      this.quillBinding = new QuillBinding(
        ((this.yService.yOperators as YMap<YMap<any>>)
          .get(element.model.id.toString()) as YMap<any>)
          .get('property'),
        this.quill,
        this.yService.awareness
      );
    })

  }

  /**
   * Given a name, this adds a new operator into Yjs data.
   * @param operatorName Name of the operator.
   */
  addNewOperator(operatorName: string) {
    this.workflowActionService.addModelOperator(operatorName);
  }

  /**
   * Function for making connection between users.
   */
  connect() {
    if (this.yService.wsProvider.shouldConnect) {
      this.yService.wsProvider.disconnect();
      this.textContent = 'Connect';
    } else {
      this.yService.wsProvider.connect();
      this.textContent = 'Disconnect';
    }
  }

  /**
   * Yjs handles undo redo. This just invokes the logic.
   */
  undo() {
    console.log(this.yService.undoManager.canUndo());
    if (this.yService.undoManager.canUndo()) {
      console.log(this.yService.undoManager.undo());
    } else
      console.log(this.yService.undoManager.undoStack);
  }

  /**
   * Yjs handles undo redo. This just invokes the logic.
   */
  redo() {
    console.log(this.yService.undoManager.canRedo());
    if (this.yService.undoManager.canRedo())
      this.yService.undoManager.redo();
    else
      console.log(this.yService.undoManager.redoStack);
  }

  /**
   * Handles mouse events to enable shared cursor.
   */
  handlePointerEvents(): void {
    fromEvent<MouseMoveEvent>(document.getElementById("paper-container") as HTMLElement, 'mousemove').subscribe(e => {
      const jointPoint = this.paper.clientToLocalPoint(new Point(e.clientX, e.clientY));
      this.yService.updateAwareness('point', jointPoint);
    });
    fromEvent<MouseLeaveEvent>(document.getElementById("paper-container") as HTMLElement, 'mouseleave').subscribe(() => {
      this.yService.updateAwareness('isActive', false);
    });
    fromEvent<MouseEnterEvent>(document.getElementById("paper-container") as HTMLElement, 'mouseenter').subscribe(() => {
      this.yService.updateAwareness('isActive', true);
    });
  }

}
