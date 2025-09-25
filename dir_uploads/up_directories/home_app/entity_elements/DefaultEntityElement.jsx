
import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as DropDownBox from "../utility_components/DropDownBox.jsx";
import * as ScoringMenu from "../utility_components/ScoringMenu.jsx";



export function render({entID, score, weight, qualKeyArr}) {
  return <div className="entity-element">
    <div>
      <div className="main-content">
        <div className="entity-id">{"#" + entID}</div>
        <EntityReference key="er" entKey={entID} />
      </div>
      <div className="score-display">
        <div className="score">{score}</div>
        <div className="weight">{weight}</div>
      </div>
    </div>
    <DropDownBox key="ddb">
      <ScoringMenu key="0" entKey={entID} qualKeyArr={qualKeyArr} />
    </DropDownBox>
  </div>;
}
