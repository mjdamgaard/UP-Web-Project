
import {toPrecision} from 'number';

import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as DropDownBox from "../utility_components/DropDownBox.jsx";
import * as ScoringMenu from "../scoring/ScoringMenu.jsx";



export function render({entID, score, weight, qualKeyArr}) {
  return <div className="entity-element">
    <div>
      <div className="main-content">
        <div className="entity-id">{"#" + entID}</div>
        <EntityReference key="er" entKey={entID} />
      </div>
      <div className="score-display">
        <div className="score">{toPrecision(score, 3)}</div>
        <div className="weight">{toPrecision(weight, 3)}</div>
      </div>
    </div>
    <DropDownBox key="ddb">
      <ScoringMenu key="_sm" entKey={entID} qualKeyArr={qualKeyArr} />
    </DropDownBox>
  </div>;
}



export const styleSheetPaths = [
  ...DropDownBox.styleSheetPaths,
  abs("./DefaultEntityElement.css"),
];