
import {toPrecision} from 'number';

import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as DropDownBox from "../utility_components/DropDownBox.jsx";
import * as ScoringMenu from "../scoring/ScoringMenu.jsx";
import * as AggregatedScoreDisplay from "../scoring/AggregatedScoreDisplay.jsx";



export function render({
  entID, qualKeyArr = [], score = undefined, weight = undefined,
  startExpanded = false,
}) {
  return <div className="entity-element">
    <div>
      <div className="main-content">
        <div className="entity-id">{"#" + entID}</div>
        <div className="entity-display">
          <EntityReference key="er" entKey={entID} />
        </div>
      </div>
      <div className="score-display">
        <AggregatedScoreDisplay key="as"
          score={score ? toPrecision(score, 3) : "N/A"}
          weight={weight ? toPrecision(weight, 3) : "N/A"}
        />
      </div>
    </div>
    <DropDownBox key="ddb" startOpen={startExpanded}>
      <ScoringMenu key="_sm" subjKey={entID} qualKeyArr={qualKeyArr} />
    </DropDownBox>
  </div>;
}



export const styleSheetPaths = [
  ...DropDownBox.styleSheetPaths,
  abs("./GeneralEntityElement.css"),
];