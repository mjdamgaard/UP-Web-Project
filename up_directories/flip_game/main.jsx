
/* HOISTED IMPORTS */
import "./GameSquare.jsx";
/* END */

import * as FlipGame from "./FlipGame.jsx";
import * as style from "./style.css";

export function render(props) {
  this.trigger("showFrame");
  return <div innerStyle={style}>
    <FlipGame key="f" {...props}/>
  </div>;
}