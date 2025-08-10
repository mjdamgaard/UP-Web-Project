
import * as styleSheet from "./style.css";


export const pegTransform = {
  styleSheets: [styleSheet],
  rules: [
    {selector: ".warning", style: [
      "color: #00ff00;", "color: #ffc107; font-style: italic;"
    ]},
  ],
};


export const guessRowTransform = {
  styleSheets: [styleSheet],
  rules: [
    {selector: ".warning", style: [
      "color: #00ff00;", "color: #ffc107; font-style: italic;"
    ]},
  ],
  childRules: [
    {key: "*", transform: pegTransform}
  ],
};




export const transform = {
  styleSheets: [styleSheet],
  rules: [
    {selector: ".error", style: "color: #dc3545;", class: "bold-text"},
  ],
  childRules: [
    {key: "r-*", transform: guessRowTransform}
  ],
};
