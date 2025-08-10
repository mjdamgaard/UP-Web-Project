
import {map, createArray} from 'array';
import * as Peg from "./Peg.jsx";

export function render({
  guess: {curSlot, slots} = defaultGuess, answer = defaultAnswer, isActive
}) {
  let guessRow = (
    <div>{
      map(slots, (colorID, ind) => {
        let className = (ind === curSlot) ? "selected" : "";
        let onClick = !isActive ? undefined : () => {
          this.trigger("changeCurrentSlot", ind);
        };
        return (
          <div className={className} onClick={onClick}>
            <Peg key={"g-" + ind} colorID={colorID}/>
          </div>
        );
      })
    }</div>
  );
  let answerGroup = (
    <div>{
      map(answer, (colorID, ind) => (
        <div>
          <Peg key={"a-" + ind} colorID={colorID}/>
        </div>
      ))
    }</div>
  );

  return (
    <div className={isActive ? "active" : ""}>
      {guessRow}
      {answerGroup}
    </div>
  );
}

const defaultGuess = {slots: createArray(4), curSlot: 0};
const defaultAnswer = createArray(4);