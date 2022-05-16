import {g} from "jointjs";
import Point = g.Point;

export interface User {
  id: string;
  point: Point;
  color: string;
  isActive: boolean;
}

export const USER_COLORS = [
  "#EC5E41",
  "#F2555A",
  "#F04F88",
  "#E34BA9",
  "#BD54C6",
  "#9D5BD2",
  "#7B66DC",
  "#5373E6",
  "#369EFF",
  "#02B1CC",
  "#11B3A3",
  "#39B178",
  "#55B467",
  "#FF802B"
];
