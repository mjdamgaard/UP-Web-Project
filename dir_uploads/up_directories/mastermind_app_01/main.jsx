
// Simple mastermind game app. No high score table, or backend data in general.
// And can so far only be controlled by mouse (since keyboard events aren't
// implemented yet for the JSX components).

import {createArray, map, slice, at, forEach} from 'array';
import {random, floor} from 'math';
import * as HeaderMenu from "./HeaderMenu.jsx";
import * as GuessRow from "./GuessRow.jsx";
import * as PegSelection from "./PegSelection.jsx";
import * as GameOverPrompt from "./GameOverPrompt.jsx";


export function render({maxGuesses = 10}) {
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
      <HeaderMenu key="menu" />
      <div className="game-area">
        <PegSelection key="pegs" />
        <div className="rows">{rows}</div>
      </div>
      <GameOverPrompt key="prompt"
        isDone={isDone} hasWon={hasWon} answers={answers}
      />
    </div>
  );
}

export function getInitState() {
  return {
    secret: getSecret(),
    guesses: [{slots: createArray(4), curSlot: 0}],
    answers: [],
    isDone: false,
    hasWon: false,
  };
}


export const actions = {
  "insertPeg": function(colorID) {
    let {isDone, guesses, answers, secret} = this.state;
    if (isDone) return;
    let curRowIndex = answers.length;
    let {curSlot, slots} = guesses[curRowIndex];

    // Insert the new peg, and check if the row is now complete as a result,
    // having one peg in each slot.
    let isComplete = true;
    let newSlots = map(slots, (prevColorID, ind) => {
      let newColorID = (ind === curSlot) ? colorID : prevColorID;
      if (newColorID === undefined) {
        isComplete = false;
      }
      return newColorID;
    });

    // We also let the curSlot property of the row increase by one, wrapping
    // around if it was the last slot. And if the row is complete, we append
    // a new (active) row to the guesses array.
    let newSlot = (curSlot + 1) % 4;
    let newGuesses = [
      ...slice(guesses, 0, -1),
      {curSlot: newSlot, slots: newSlots},
      ...(isComplete ? [{slots: createArray(4), curSlot: 0}] : []),
    ];

    // And if the row is complete, we append the answer to the answers array,
    // and check the win and lose conditions.
    let hasWon = false, newAnswers = answers;
    if (isComplete) {
      let newAnswer;
      [newAnswer, hasWon] = getAnswer(newSlots, secret);
      newAnswers = [...answers, newAnswer];

      // Check if the payer has won or lost.
      if (hasWon || newAnswers.length === (this.props.maxGuesses ?? 10)) {
        isDone = true;
      }
    }

    // Finally, we set the state with the now guesses and answers arrays.
    this.setState({
      secret: secret,
      guesses: newGuesses,
      answers: newAnswers,
      isDone: isDone,
      hasWon: hasWon,
    });
  },
  "changeCurrentSlot": function(newSlot) {
    let {guesses} = this.state;
    let {slots} = at(guesses, -1);
    let newGuesses = [
      ...slice(guesses, 0, -1),
      {curSlot: newSlot, slots: slots},
    ];
    this.setState({...this.state, guesses: newGuesses});
  },
  "newGame": function() {
    this.setState(getInitState());
  }
};

export const events = [
  ["peg-selected", "insertPeg"],
  "changeCurrentSlot",
  "newGame",
  ["exit", "newGame"], // "exit" isn't implement yet; just redirects to
  // "new-game".
];


export function getSecret() {
  return createArray(4, () => floor(random() * 8));
}



export function getAnswer(newSlots, secret) {
  let redCount = 0, whiteCount = 0, hasWon = false;
  let usedSecretSlots = new MutableArray();
  let usedGuessSlots = new MutableArray();

  // Count the red answer pegs (right place, right color), and mark them
  // in the usedSecretSlots array such that we can omit them when counting
  // the wite answer pegs.
  forEach(newSlots, (colorID, ind) => {
    if (colorID === secret[ind]) {
      redCount++;
      usedSecretSlots[ind] = usedGuessSlots[ind] = true;
    }
  });
  if (redCount === 4) hasWon = true;

  // Now count the white answer pegs, also marking the secret slots used in
  // the process as to not double count a white answer peg from the same
  // secret slot.
  forEach(newSlots, (guessColorID, guessSlotInd) => {
    forEach(secret, (secretColorID, secretSlotInd) => {
      if (usedGuessSlots[guessSlotInd] || usedSecretSlots[secretSlotInd]) {
        return;
      }
      if (guessColorID === secretColorID) {
        whiteCount++;
        usedSecretSlots[secretSlotInd] = true;
        usedGuessSlots[guessSlotInd] = true;
      }
    });
  });

  // And finally construct the answer from the red and white peg counts.
  let answer = createArray(4, () => {
    if (redCount) {
      redCount--;
      return "red";
    }
    else if (whiteCount) {
      whiteCount--;
      return "white";
    }
    else return undefined;
  });
  return [answer, hasWon];
}


export const stylePath = "./main.style.js";
