
import * as ScoreInterface from "./ScoreInterface.jsx";



export function render({subjKey, qualKeyArr}) {
  return (
    <div className="scoring-menu">{(
      qualKeyArr.map((qualKey, ind) => (
        <ScoreInterface key={"_" + ind} subjKey={subjKey} qualKey={qualKey} />
      ))
    )}</div>
  );
}
