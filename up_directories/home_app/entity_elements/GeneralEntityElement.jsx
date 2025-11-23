
import {toPrecision} from 'number';

import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as ExpandableElement
from "../utility_components/ExpandableElement.jsx";
// import * as EntityPage from "../variable_components/EntityPage.jsx";

import * as AggregatedScoreDisplay from "../scoring/AggregatedScoreDisplay.jsx";



export function render({
  entID, qualKeyArr = [], score = undefined, weight = undefined,
}) {console.log("render");
  return <div className="entity-element">
    <ExpandableElement key="0" ExpandedComponent={
      "..."
    }>
      <div className="entity-display">
        <EntityReference key="er" entKey={entID} />
      </div>
      <AggregatedScoreDisplay key="as"
        score={score ? toPrecision(score, 3) : "N/A"}
        weight={weight ? toPrecision(weight, 3) : "N/A"}
      />
    </ExpandableElement>
  </div>;
}



export const styleSheetPaths = [
  ...ExpandableElement.styleSheetPaths,
  abs("./GeneralEntityElement.css"),
];