

/* HOISTED IMPORTS */
import "./src/GuessRow.jsx";
import "./src/PegSelection.jsx";
import "./src/Peg.jsx";
import "./src/GameOverPrompt.jsx";
/* END */


import * as Mastermind from "./Mastermind.jsx";
import * as style from "./style.css";


export function render() {
  return <div innerStyle={style}>
    <Mastermind key="0" />
  </div>;
}
