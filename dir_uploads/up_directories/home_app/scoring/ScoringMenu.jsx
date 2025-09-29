
import {map} from 'array';
import * as ScoreInterface from "./ScoreInterface.jsx";



export function render({subjKey, qualKeyArr}) {
  return (
    <div className="scoring-menu">{
      map(qualKeyArr, (qualKey, ind) => (
        <ScoreInterface key={"_" + ind} subjKey={subjKey} qualKey={qualKey} />
      ))
    }</div>
  );
}
