
import {createArray} from 'array';
import * as Peg from "./Peg.jsx";

export function render() {
  return (
    <div className="peg-selection">{
      createArray(8, ind => (
        <div onClick={() => {
          this.trigger("peg-selected", ind);
        }}>
          <Peg key={"p-" + ind} colorID={ind} />
        </div>
      ))
    }</div>
  );
}
