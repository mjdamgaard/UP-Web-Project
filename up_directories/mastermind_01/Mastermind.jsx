
import {createArray} from 'array';
import * as GuessRow from "../mastermind/src/GuessRow.jsx";
import * as PegSelection from "../mastermind/src/PegSelection.jsx";
import * as GameOverPrompt from "../mastermind/src/GameOverPrompt.jsx";

import {initialize, actions, events} from "../mastermind/Mastermind.jsx";
export {initialize, actions, events};


export function render({maxGuesses}) {
  let {isDone, hasWon, guesses, answers} = this.state;
  let curRowIndex = answers.length;

  let rows = createArray(maxGuesses, ind => {
    let rowIndex = maxGuesses - ind - 1;
    return <GuessRow key={"r-" + rowIndex}
      guess={guesses[rowIndex]} isActive={rowIndex == curRowIndex}
      answer={answers[rowIndex]}
    />;
  });

  return (
    <div className="app">
      <div className="game-area">
        <div className="rows">{(rows)}</div>
        <PegSelection key="pegs" />
      </div>
      <GameOverPrompt key="prompt"
        isDone={isDone} hasWon={hasWon} answers={answers}
      />
    </div>
  );
}
