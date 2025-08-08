
import * as styleSheet1 from "./style1.css";
import * as FooStyle2 from "./foo.style2.js";

export const transform = {
  styleSheets: [
    styleSheet1,
  ],
  rules: [
    {selector: ".warning", style: [
      "color: #00ff00;", "color: #ffc107; font-style: italic;"
    ]},
    {selector: ".error", style: "color: #dc3545;", class: "bold-text"},
  ],
  childRules: [
    {key: 2, transform: FooStyle2.transform}
  ],
};
