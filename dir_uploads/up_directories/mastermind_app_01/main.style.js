
import * as styleSheet from "./style.css";


export const pegTransform = {
  styleSheets: [styleSheet],
  rules: [
    {selector: ":scope", style: (_, {colorID}) => {
      if (!colorID && colorID !== 0) {
        return "visibility:hidden;";
      }
      else {
        return "background-color:" + (pegColors[colorID] ?? "white") + ";";
      }
    }},
  ],
};

export const pegColors = {
  "red": "red",
  "white": "white",
  "0": "red",
  "1": "yellow",
  "2": "purple",
  "3": "green",
  "4": "orange",
  "5": "pink",
  "6": "blue",
  "7": "brown",
};


export const transform = {
  styleSheets: [styleSheet],
  childRules: [
    {key: "p-*", transform: pegTransform},
    {key: "!p-*", transform: "copy"},
  ],
};


