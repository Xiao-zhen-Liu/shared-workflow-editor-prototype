import {Injectable} from '@angular/core';
import * as joint from 'jointjs';
import {dia} from 'jointjs';
import {YMap} from 'yjs/dist/src/types/YMap';
import {YText} from 'yjs/dist/src/types/YText';
import {OperatorLink} from "../../types/workflow-common.interface";
import Point = dia.Point;

/**
 * Defines the SVG element for the breakpoint button
 */
export const breakpointButtonSVG = `<svg class="breakpoint-button" height = "24" width = "24">
    <path d="M0 0h24v24H0z" fill="none" /> +
    <polygon points="8,2 16,2 22,8 22,16 16,22 8,22 2,16 2,8" fill="red" />
  </svg>
  <title>Add Breakpoint.</title>`;
/**
 * Defines the SVG path for the delete button
 */
export const deleteButtonPath =
  "M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41" +
  " 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2" +
  " 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z";

/**
 * Defines the HTML SVG element for the delete button and customizes the look
 */
export const deleteButtonSVG = `<svg class="delete-button" height="24" width="24">
    <path d="M0 0h24v24H0z" fill="none" pointer-events="visible" />
    <path d="${deleteButtonPath}"/>
  </svg>`;

/**
 * Defines the SVG path for the collapse button
 */
export const collapseButtonPath =
  "M4 7 H12 v2 H4 z" +
  " M0 3 Q0 0 3 0 h10 Q16 0 16 3 v10 H14 V3 Q14 2 13 2 H3 Q2 2 2 3 z" +
  " M0 3 v10 Q0 16 3 16 h10 Q16 16 16 13 H14 Q14 14 13 14 H3 Q2 14 2 13 V3 z";

/**
 * Defines the HTML SVG element for the collapse button and customizes the look
 */
export const collapseButtonSVG = `<svg class="collapse-button" height="16" width="16">
    <path d="M0 0 h16 v16 H0 z" fill="none" pointer-events="visible" />
    <path d="${collapseButtonPath}" />
  </svg>`;

/**
 * Defines the SVG path for the expand button
 */
export const expandButtonPath =
  "M4 7 h3 V4 h2 V7 h3 v2 h-3 V12 h-2 V9 h-3 z" +
  " M0 3 Q0 0 3 0 h10 Q16 0 16 3 v10 H14 V3 Q14 2 13 2 H3 Q2 2 2 3 z" +
  " M0 3 v10 Q0 16 3 16 h10 Q16 16 16 13 H14 Q14 14 13 14 H3 Q2 14 2 13 V3 z";

/**
 * Defines the HTML SVG element for the expand button and customizes the look
 */
export const expandButtonSVG = `<svg class="expand-button" height="16" width="16">
    <path d="M0 0 h16 v16 H0 z" fill="none" pointer-events="visible" />
    <path d="${expandButtonPath}" />
  </svg>`;

/**
 * Defines the handle (the square at the end) of the source operator for a link
 */
export const sourceOperatorHandle = "M 0 0 L 0 8 L 8 8 L 8 0 z";

/**
 * Defines the handle (the arrow at the end) of the target operator for a link
 */
export const targetOperatorHandle = "M 12 0 L 0 6 L 12 12 z";

export const operatorCacheTextClass = "texera-operator-result-cache-text";
export const operatorCacheIconClass = "texera-operator-result-cache-icon";
export const operatorStateBGClass = "texera-operator-state-background";
export const operatorStateClass = "texera-operator-state";

export const operatorProcessedCountBGClass = "texera-operator-processed-count-background";
export const operatorProcessedCountClass = "texera-operator-processed-count";
export const operatorOutputCountBGClass = "texera-operator-output-count-background";
export const operatorOutputCountClass = "texera-operator-output-count";
export const operatorAbbreviatedCountBGClass = "texera-operator-abbreviated-count-background";
export const operatorAbbreviatedCountClass = "texera-operator-abbreviated-count";

export const operatorIconClass = "texera-operator-icon";
export const operatorNameClass = "texera-operator-name";
export const operatorNameBGClass = "texera-operator-name-background";

export const linkPathStrokeColor = "#919191";

class TexeraCustomJointElement extends joint.shapes.devs.Model {
  override markup = `<g class="element-node">
      <rect class="body"></rect>
      <rect class="boundary"></rect>
      <image class="${operatorIconClass}"></image>
      <text class="${operatorNameBGClass}"></text>
      <text class="${operatorNameClass}"></text>
      <text class="${operatorProcessedCountBGClass}"></text>
      <text class="${operatorProcessedCountClass}"></text>
      <text class="${operatorOutputCountBGClass}"></text>
      <text class="${operatorOutputCountClass}"></text>
      <text class="${operatorAbbreviatedCountBGClass}"></text>
      <text class="${operatorAbbreviatedCountClass}"></text>
      <text class="${operatorStateBGClass}"></text>
      <text class="${operatorStateClass}"></text>
      <text class="${operatorCacheTextClass}"></text>
      <image class="${operatorCacheIconClass}"></image>
      ${deleteButtonSVG}
    </g>`;
}

/**
 * Copied from Texera, added a few things for this prototype.
 */
@Injectable({
  providedIn: 'root'
})
export class JointUIService {
  public static readonly DEFAULT_OPERATOR_WIDTH = 60;
  public static readonly DEFAULT_OPERATOR_HEIGHT = 60;


  public static getJointOperatorElement(op: YMap<any>): joint.dia.Element {
    const label : string = op.get('operatorContent');
    const pos : Point = op.get('operatorPosition');
    const id : string = op.get('operatorId');
    const type: string = op.get('type');
    const property: string = (op.get('property') as YText).toString();
    console.log(property);

    const operatorElement = new TexeraCustomJointElement({
      id: id,
      position: pos,
      size: {
        width: JointUIService.DEFAULT_OPERATOR_WIDTH,
        height: JointUIService.DEFAULT_OPERATOR_HEIGHT,
      },
      attrs: JointUIService.getCustomOperatorStyleAttrs(label, type),
      ports: {
        groups: {
          in: { attrs: JointUIService.getCustomPortStyleAttrs() },
          out: { attrs: JointUIService.getCustomPortStyleAttrs() },
        },
      },
    });

    operatorElement.addPort({group: "in"});
    operatorElement.addPort({group: "out"});
    return  operatorElement;
  }

  public static getCustomPortStyleAttrs(): joint.attributes.SVGAttributes {
    const portStyleAttrs = {
      ".port-body": {
        fill: "#A0A0A0",
        r: 5,
        stroke: "none",
      },
      ".port-label": {},
    };
    return portStyleAttrs;
  }

  public static getJointLinkCell(link: OperatorLink): joint.dia.Link {
    const jointLinkCell = JointUIService.getDefaultLinkCell();
    jointLinkCell.set("source", {
      id: link.source.operatorID,
      port: link.source.portID,
    });
    jointLinkCell.set("target", {
      id: link.target.operatorID,
      port: link.target.portID,
    });
    jointLinkCell.set("id", link.linkID);
    return jointLinkCell;
  }

  public static getDefaultLinkCell(): joint.dia.Link {
    const link = new joint.dia.Link({
      // router: {
      //   name: "manhattan",
      // },
      connector: {
        name: "rounded",
      },
      toolMarkup: `<g class="link-tool">
          <g class="tool-remove" event="tool:remove">
          <circle r="11" />
            <path transform="scale(.8) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777
            10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419
            10.946,24.248 16.447,18.746 21.948,24.248z"/>
            <title>Remove link.</title>
           </g>
         </g>`,
      attrs: {
        ".connection": {
          stroke: linkPathStrokeColor,
          "stroke-width": "2px",
        },
        ".connection-wrap": {
          "stroke-width": "0px",
          "stroke": "#919191",
          // 'display': 'inline'
        },
        ".marker-source": {
          d: sourceOperatorHandle,
          stroke: "none",
          fill: "#919191",
        },
        ".marker-arrowhead-group-source .marker-arrowhead": {
          d: sourceOperatorHandle,
        },
        ".marker-target": {
          d: targetOperatorHandle,
          stroke: "none",
          fill: "#919191",
        },
        ".marker-arrowhead-group-target .marker-arrowhead": {
          d: targetOperatorHandle,
        },
        ".tool-remove": {
          fill: "rgba(54,51,51,0.2)",
          width: 24,
          display: "none",
        },
        // ".tool-remove path": {
        //   d: deleteButtonPath,
        //   fill: "#d8656a",
        //   transform: "translate(-12px, -12px)"
        // },
        ".tool-remove circle": {
          "fill-opacity": 0
        },
        ".marker-arrowhead": {
          fill: "#919191",
        },
      },
    });
    return link;
  }

  public static getCustomOperatorStyleAttrs(
    operatorDisplayName: string,
    operatorType: string
  ): joint.shapes.devs.ModelSelectors {
    const operatorStyleAttrs = {
      ".texera-operator-state-background": {
        text: "",
        "font-size": "14px",
        stroke: "#f5f5f5",
        "stroke-width": "1em",
        visibility: "hidden",
        "ref-x": 0.5,
        "ref-y": 100,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-state": {
        text: "",
        "font-size": "14px",
        visibility: "hidden",
        "ref-x": 0.5,
        "ref-y": 100,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-abbreviated-count-background": {
        text: "",
        "font-size": "14px",
        stroke: "#f5f5f5",
        "stroke-width": "1em",
        visibility: "visible",
        "ref-x": 0.5,
        "ref-y": -30,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-abbreviated-count": {
        text: "",
        fill: "green",
        "font-size": "14px",
        visibility: "visible",
        "ref-x": 0.5,
        "ref-y": -30,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-processed-count-background": {
        text: "",
        "font-size": "14px",
        stroke: "#f5f5f5",
        "stroke-width": "1em",
        visibility: "hidden",
        "ref-x": 0.5,
        "ref-y": -50,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-processed-count": {
        text: "",
        fill: "green",
        "font-size": "14px",
        visibility: "hidden",
        "ref-x": 0.5,
        "ref-y": -50,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-output-count-background": {
        text: "",
        "font-size": "14px",
        stroke: "#f5f5f5",
        "stroke-width": "1em",
        visibility: "hidden",
        "ref-x": 0.5,
        "ref-y": -30,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".texera-operator-output-count": {
        text: "",
        fill: "green",
        "font-size": "14px",
        visibility: "hidden",
        "ref-x": 0.5,
        "ref-y": -30,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      "rect.body": {
        fill: "#FFFFFF",
        "follow-scale": true,
        stroke: "gray",
        "stroke-width": "2",
        rx: "5px",
        ry: "5px",
      },
      "rect.boundary": {
        fill: "rgba(0,0,0,0)",
        width: this.DEFAULT_OPERATOR_WIDTH + 50,
        height: this.DEFAULT_OPERATOR_HEIGHT + 100,
        ref: "rect.body",
        "ref-x": -25,
        "ref-y": -50,
      },
      ".texera-operator-name-background": {
        text: operatorDisplayName,
        "font-size": "14px",
        stroke: "#f5f5f5",
        "stroke-width": "1em",
        "ref-x": 0.5,
        "ref-y": 80,
        ref: "rect.body",
        "y-alignment": "middle",
      "x-alignment": "middle",
      },
      ".texera-operator-name": {
        text: operatorDisplayName,
        fill: "#595959",
        "font-size": "14px",
        "ref-x": 0.5,
        "ref-y": 80,
        ref: "rect.body",
        "y-alignment": "middle",
        "x-alignment": "middle",
      },
      ".delete-button": {
        x: 60,
        y: -20,
        cursor: "pointer",
        fill: "rgba(54,51,51,0.2)",
        event: "element:delete",
        visibility: "hidden",
      },
      // ".texera-operator-icon": {
      //   "xlink:href": "assets/operator_images/" + operatorType + ".png",
      //   width: 35,
      //   height: 35,
      //   "ref-x": 0.5,
      //   "ref-y": 0.5,
      //   ref: "rect.body",
      //   "x-alignment": "middle",
      //   "y-alignment": "middle",
      // },
    };
    return operatorStyleAttrs;
  }

  public static getJointUserPointerCell(userID: string, position: Point, color: string): joint.dia.Element {
    const userCursor = new joint.shapes.standard.Circle({
      id: userID
    });
    userCursor.resize(15, 15);
    userCursor.position(position.x, position.y);
    userCursor.attr("body/fill", color);
    userCursor.attr("body/stroke", color);
    return userCursor;
  }
}
