
import {createArray} from 'array';
import * as Peg from "./Peg.jsx";

export function render({
  guess: {curSlot, slots} = defaultGuess, answer = defaultAnswer, isActive
}) {
  let guessRow = (
    <div className="guess-row">{(
      slots.map((colorID, ind) => {
        let className = (ind === curSlot) ? "selected" : "";
        let onClick = !isActive ? undefined : () => {
          this.trigger("changeCurrentSlot", ind);
        };
        return (
          <div className={className} onClick={onClick}>
            <Peg key={"p-g-" + ind} colorID={colorID}/>
          </div>
        );
      })
    )}</div>
  );
  let answerGroup = (
    <div className="answer">{(
      answer.map((colorID, ind) => (
        <Peg key={"p-a-" + ind} colorID={colorID}/>
      ))
    )}</div>
  );

  return (
    <div className={isActive ? "active" : ""}>
      {(guessRow)}
      {(answerGroup)}
    </div>
  );
}

const defaultGuess = {slots: createArray(4), curSlot: 0};
const defaultAnswer = createArray(4);