import {Injectable} from '@angular/core';
import * as joint from 'jointjs';
import {g, util} from 'jointjs';
import {JointGraphWrapper} from './joint-graph-wrapper';
import {YService} from '../y/y.service';
import {YMap} from 'yjs/dist/src/types/YMap';
import * as Y from 'yjs';
import {JointUIService} from '../joint-ui/joint-ui.service';
import {auditTime, filter, map, tap} from 'rxjs/operators';
import uuid = util.uuid;
import Point = g.Point;
import {OperatorLink} from "../../types/workflow-common.interface";
import {User} from "../../types/user.interface";

/**
 * Handles all tyes of actions related to both jointjs and yjs.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkflowActionService {

  public readonly jointGraph: joint.dia.Graph;
  private readonly jointGraphWrapper: JointGraphWrapper;
  private listenToPositionChange: boolean = true;
  private otherUsers!: User[];

  constructor(private yService: YService) {
    this.jointGraph = new joint.dia.Graph();
    this.jointGraphWrapper = new JointGraphWrapper(this.jointGraph);
    this.yService.dbProvider.on('synced', () => {
      this.observeYDataChange();
      this.handleJointOperatorDrag();
      this.handleJointLinkEvents();
    })
  }

  // ************************************** Utility functions. *********************************************************

  /**
   * Copied from Texera. Converts a joint link into a common type.
   * @param jointLink
   */
  static getOperatorLink(jointLink: joint.dia.Link): OperatorLink {
    type jointLinkEndpointType = { id: string; port: string } | null | undefined;

    // the link should be a valid link (both source and target are connected to an operator)
    // isValidLink function is not reused because of Typescript strict null checking
    const jointSourceElement: jointLinkEndpointType = jointLink.attributes["source"];
    const jointTargetElement: jointLinkEndpointType = jointLink.attributes["target"];

    if (!jointSourceElement) {
      throw new Error("Invalid JointJS Link: no source element");
    }

    if (!jointTargetElement) {
      throw new Error("Invalid JointJS Link: no target element");
    }

    return {
      linkID: jointLink.id.toString(),
      source: {
        operatorID: jointSourceElement.id,
        portID: jointSourceElement.port,
      },
      target: {
        operatorID: jointTargetElement.id,
        portID: jointTargetElement.port,
      },
    };
  }

  static getOperatorRandomUUID(): string {
    return "operator-" + uuid();
  }

  private isValidJointLink(jointLink: joint.dia.Link): boolean {
    return (
      jointLink &&
      jointLink.attributes &&
      jointLink.attributes['source'] &&
      jointLink.attributes['target'] &&
      jointLink.attributes['source'].id &&
      (jointLink.attributes['source'].port) &&
      jointLink.attributes['target'].id &&
      (jointLink.attributes['target'].port) &&
      (this.yService.yOperators.has(jointLink.attributes['source'].id.toString()) &&
        this.yService.yOperators.has(jointLink.attributes['target'].id.toString()))
    );
    // the above two lines are causing unit test fail in sync-texera-model.spec.ts
    // since if operator is deleted first the link will become invalid and thus undeletable.
  }

  // ************************************** Functions manipulating yjs data. *******************************************

  /**
   * Adds an operator to yjs data by creating an new YMap and setting its fields manually.
   * @param label Name of the operator
   */
  public addModelOperator(label: string): void {
    const yop = new Y.Map<any>();
    const uid = WorkflowActionService.getOperatorRandomUUID();
    yop.set('operatorId', uid);
    yop.set('operatorContent', label);
    yop.set('operatorPosition', new Point(0, 0));
    yop.set('type', 'default');
    yop.set('property', new Y.Text("Default Property"));
    this.yService.yOperators.set(uid, yop);
  }

  /**
   * Delete an operator from yjs data, and links associated with it if any.
   * @param operatorId
   */
  public deleteModelOperator(operatorId: string): void {
    this.yService.yOperators.delete(operatorId);
    // also delete link associated with it in the model
    this.yService.yLinks.forEach((link) => {
      if (link.target.operatorID.toString() === operatorId || link.source.operatorID.toString() === operatorId) {
        console.log("Also deleted link:", link);
        this.yService.yLinks.delete(link.linkID);
      }
    })
  }

  /**
   * Add a link into yjs data.
   * @param link
   * @private
   */
  private addModelLink(link: OperatorLink) {
    this.yService.yLinks.set(link.linkID, link);
  }

  // ************************************** Functions handling jointjs view. *******************************************

  /**
   * Load all operator and link data from yjs into jointjs canvas.
   */
  public loadJointGraphFromYTexeraGraph(): void {
    const YOps = this.yService.yOperators;
    YOps.forEach((value) => {
      this.addJointOp(value);
    })
    const YLinks = this.yService.yLinks;
    YLinks.forEach((link) => {
      this.addJointLink(link);
    })
  }

  /**
   * Add an operator from yjs data into jointjs canvas.
   * @param yOp
   * @private
   */
  private addJointOp(yOp: YMap<string>): void {
    const element = JointUIService.getJointOperatorElement(yOp);
    this.jointGraph.addCell(element);
  }

  /**
   * Delete an operator from jointjs canvas.
   * @param operatorId
   * @private
   */
  private deleteJointOp(operatorId: string): void {
    this.jointGraph.getCell(operatorId).remove();
  }

  /**
   * Add link into jointjs canvas.
   * @param link
   * @private
   */
  private addJointLink(link: OperatorLink): void {
    const jointLinkCell = JointUIService.getJointLinkCell(link);
    try {
      this.jointGraph.addCell(jointLinkCell);
    } catch (error) {
      this.yService.yLinks.delete(link.linkID);
    }
  }

  /**
   * Delete link from jointjs canvas.
   * @param linkID
   * @private
   */
  private deleteJointLink(linkID: string): boolean {
    const jointLink: joint.dia.Cell | undefined = this.jointGraph.getCell(linkID);
    if (jointLink) {
      jointLink.remove();
      return true;
    } else return false;
  }

  // ************************************** Observers handling events from jointjs. ************************************

  /**
   * Handle user dragging and saves the new coordinates into yjs data.
   * @private
   */
  private handleJointOperatorDrag() {
    let dragRoot: string;
    this.jointGraphWrapper
      .getElementPositionChangeEvent()
      .subscribe(event => {
        dragRoot = event.elementID;
      });
    this.jointGraphWrapper
      .getElementPositionChangeEvent()
      .pipe(
        filter(() => this.listenToPositionChange),
        filter(value => value.elementID === dragRoot),
        auditTime(16) // emit frequently to achieve "60fps"
      )
      .subscribe(event => {
          const op = this.yService.yOperators.get(dragRoot) as YMap<any>;
          if ((op.get('operatorPosition') as Point) != (event.newPosition as Point) && this.listenToPositionChange)
            op.set('operatorPosition', event.newPosition as Point);
        }
      )
  }

  /**
   * Maintain correct link behaviour.
   * @private
   */
  private handleJointLinkEvents(): void {
    this.jointGraphWrapper
      .getJointLinkCellAddStream()
      .pipe(
        filter(link => this.isValidJointLink(link)),
        map(link => WorkflowActionService.getOperatorLink(link))
      )
      .subscribe(link => {
        if (!this.yService.yLinks.has(link.linkID)) {
          console.log('Added link:', link);
          this.addModelLink(link);
        }
      });

    this.jointGraphWrapper
      .getJointLinkCellDeleteStream()
      .pipe(
        filter(link => this.isValidJointLink(link)),
        map(link => WorkflowActionService.getOperatorLink(link))
      )
      .subscribe(link => {
        const linkID = link.linkID;
        if (this.yService.yLinks.has(linkID)) {
          this.yService.yLinks.delete(linkID);
          console.log('Deleted link:', link);
        }
      });

    this.jointGraphWrapper
      .getJointLinkCellChangeStream()
      .pipe(
        tap(link => {
          const linkID = link.id.toString();
          if (this.yService.yLinks.has(linkID)) {
            this.yService.yLinks.delete(linkID);
            console.log('Deleted link during update:', link);
          }
        }),
        filter(link => this.isValidJointLink(link)),
        map(link => WorkflowActionService.getOperatorLink(link))
      )
      .subscribe(link => {
        console.log('Added updated link:', link);
        const linkID = link.linkID
        this.yService.yLinks.set(linkID, link);
      })
  }

  // ************************************** Observers handling events from yjs. ****************************************

  /**
   * Calls all the yjs observers.
   * @private
   */
  private observeYDataChange(): void {
    this.yService.yOperators.observe(this.yOperatorObserver);
    this.yService.yOperators.observeDeep(this.yOperatorPositionObserver);
    this.yService.yLinks.observe(this.yLinkObserver);
    this.yService.awareness.on("change", this.userCursorObserver)
  }

  /**
   * Handles the addition/deletion of y operator data.
   * @param event
   */
  private yOperatorObserver = (event: Y.YMapEvent<Y.Map<any>>) => {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        const newYOp = this.yService.yOperators.get(key) as YMap<any>;
        this.addJointOp(newYOp);
      } else if (change.action === 'delete') {
        this.deleteJointOp(key);
      }
    })
  }

  /**
   * Using yjs's observeDeep, capture and handle subdata changes (position).
   * @param events
   */
  private yOperatorPositionObserver = (events: Y.YEvent<any>[]) => {
    events.forEach(event => {
      if (event.target !== this.yService.yOperators) {
        event.changes.keys.forEach((change, key) => {
          if (change.action === 'update') {
            if (key == 'operatorPosition') {
              const newPos: Point = (event.target as YMap<any>).get('operatorPosition');
              const id: string = (event.target as YMap<any>).get('operatorId');
              this.listenToPositionChange = false;
              this.jointGraphWrapper.setAbsolutePosition(id, newPos.x, newPos.y);
              this.listenToPositionChange = true;
            }
          }
        })
      }
    })
  }

  /**
   * Handles the addition/deletion of links.
   * @param event
   */
  private yLinkObserver = (event: Y.YMapEvent<OperatorLink>) => {
    event.changes.keys.forEach((change, key) => {
      if (change.action === 'add') {
        const newLink = this.yService.yLinks.get(key) as OperatorLink;
        console.log('Detected new link:', newLink);
        this.addJointLink(newLink);
      } else if (change.action === 'delete') {
        this.deleteJointLink(key);
        console.log('Detected link deleted:', key);
      } else if (change.action === 'update') {
        console.log('Detected link updated:', key);
        if (this.deleteJointLink(key)) {
          const newLink: OperatorLink = this.yService.yLinks.get(key) as OperatorLink;
          this.addJointLink(newLink);
        }
      }
    })
  }

  /**
   * Handles changes of other users' cursors.
   */
  private userCursorObserver = () => {
    this.otherUsers = Array.from(this.yService.awareness.getStates().values() as IterableIterator<User>)
      .filter((user) => user.id && user.id !== this.yService.awareness.clientID.toString());

    this.otherUsers.forEach((user) => {
      const cell: joint.dia.Cell | undefined = this.jointGraph.getCell(user.id);
      if (cell) {
        if (user.isActive) {
          cell.remove();
          const newPoint = JointUIService.getJointUserPointerCell(user.id, user.point, user.color);
          this.jointGraph.addCell(newPoint);
        } else
          cell.remove();
      } else {
        if (user.isActive) {
          // create new user point (directly updating the point would cause unknown errors)
          const newPoint = JointUIService.getJointUserPointerCell(user.id, user.point, user.color);
          this.jointGraph.addCell(newPoint);
        }
      }
    })
  }
}
