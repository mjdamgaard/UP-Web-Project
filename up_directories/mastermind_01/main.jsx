

/* HOISTED IMPORTS */
import "../mastermind/src/GuessRow.jsx";
import "../mastermind/src/PegSelection.jsx";
import "../mastermind/src/Peg.jsx";
import "../mastermind/src/GameOverPrompt.jsx";
/* END */


import * as Mastermind from "./Mastermind.jsx";
import * as style from "./style.css";


export function render() {
  return <div innerStyle={style}>
    <Mastermind key="0" maxGuesses={9} />
  </div>;
}
