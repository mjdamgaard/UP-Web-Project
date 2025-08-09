
import {map} from 'array';
import * as Peg from "./Peg.jsx";

export function render({guess: {curSlot, slots}, answer, isActive}) {
  let guessRow = (
    <div>{
      map(slots, (colorID, ind) => {
        let className = (ind === curSlot) ? "selected" : "";
        let onClick = !isActive ? undefined : () => {
          this.trigger("changeCurrentSlot", ind);
        };
        return (
          <div className={className} onClick={onClick}>
            <Peg colorID={colorID}/>
          </div>
        );
      })
    }</div>
  );
  let answerGroup = (
    <div>{
      map(answer, colorID => (
        <div>
          <Peg colorID={colorID}/>
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
