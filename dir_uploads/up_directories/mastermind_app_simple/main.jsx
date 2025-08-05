
import {createArray} from 'array';
import * as HeaderMenu from "./HeaderMenu.js";
import * as PegSelection from "./PegSelection.js";

export function render({maxGuesses = 10}) {
  let {secret, curGuessIndex} = this.state;

  let rows = createArray(maxGuesses, ind => {
      let rowIndex = maxGuesses - ind - 1;
      return <GuessRow key={"r" + rowIndex}
        secret={secret} isActive={rowIndex === maxGuesses}
      />;
    })

  return (
    <div>
      <HeaderMenu key="m" />
      <div className="rows">{rows}</div>
      <PegSelection key="s" />
    </div>
  );
}

export function getInitState() {
  return {
    secret: secret = getSecret(),
    curGuessIndex: 0,
    hasWon: false,
  }
}


export const actions = {
  "nextGuess": function() {
    let prevGuessIndex = this.state.curGuessIndex;
    this.setState({...this.state, curGuessIndex: prevGuessIndex + 1});
  },
  "win": function() {
    this.setState({...this.state, hasWon: true});
  }
};

export const events = [
  "nextGuess",
  "win",
];


export function getSecret() {

}