
import * as styleSheet1 from "./style.css";
import * as FooStyle from "./foo.style.js";

export const transform = {
  // styleSheets: [
  //   styleSheet1,
  // ],
  rules: [
    {selector: ".warning", style: [
      "color: #1cff07ff;", "color: #ffc107; font-style: italic;"
    ]},
    {selector: ".error", style: "color: #dc3545;", /*class: "danger"*/},
  ],
};
