import {Injectable} from '@angular/core';
import * as Y from 'yjs';
import {IndexeddbPersistence} from 'y-indexeddb';
import {WebsocketProvider} from 'y-websocket';
import {Awareness} from 'y-protocols/awareness';
import {g} from 'jointjs';
import {OperatorLink} from "../../types/workflow-common.interface";
import {USER_COLORS} from "../../types/user.interface";
import Point = g.Point;

const sample = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * The main entry to yjs-related things.
 */
@Injectable({
  providedIn: 'root'
})
export class YService {

  public doc = new Y.Doc();

  // Should be replaced with our own provider.
  public dbProvider = new IndexeddbPersistence('TEXERA_', this.doc);
  // Should be replaced with our own provider.
  public wsProvider = new WebsocketProvider(
    'wss://demos.yjs.dev',
    'TEXERA_',
    this.doc
  );
  // The top-level model.
  public yModel: Y.Map<any> = this.doc.getMap('ymodel');
  // Operators with nested type.
  public yOperators!: Y.Map<Y.Map<any>>;
  // Links.
  public yLinks!: Y.Map<OperatorLink>;
  // Undo manager.
  public undoManager!: Y.UndoManager;
  // Syncs user cursors.
  public awareness: Awareness = this.wsProvider.awareness;

  constructor() {
    this.dbProvider.on('synced', ()=>{
      if (!this.yModel.has('operators')) {
        console.log('operators undefined');
        this.yModel.set('operators', new Y.Map<Y.Map<any>>());
      }
      if (!this.yModel.has('linkMap')) {
        console.log('links undefined');
        this.yModel.set('linkMap', new Y.Map<OperatorLink>());
      }
      this.yOperators = this.yModel.get('operators');
      this.yLinks = this.yModel.get('linkMap');
      this.awareness.setLocalState({
        id: this.awareness.clientID.toString(),
        point: new Point(0, 0),
        color: sample(USER_COLORS),
        isActive: false
      });
      this.undoManager = new Y.UndoManager(this.yModel);
    })
  }

  public updateAwareness(field: string, value: any): void {
    this.awareness.setLocalStateField(field, value);
  }
}
