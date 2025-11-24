
import {toPrecision} from 'number';

import * as EntityReference from "../misc/EntityReference.jsx";
import * as ExpandableElement
from "../misc/ExpandableElement.jsx";
// import * as EntityPage from "../variable_components/EntityPage.jsx";

import * as AggregatedScoreDisplay from "../scoring/AggregatedScoreDisplay.jsx";



export function render({
  entID, qualKeyArr = [], score = undefined, weight = undefined,
}) {
  return <div className="entity-element">
    <ExpandableElement key="ee" ExpandedComponent={
      "..."
    }>
      <div onClick={() => this.call("ee", "expand")}>
        <div className="entity-display">
          <EntityReference key="er" entKey={entID} isLink={false} />
        </div>
        <AggregatedScoreDisplay key="as"
          score={score ? toPrecision(score, 3) : "N/A"}
          weight={weight ? toPrecision(weight, 3) : "N/A"}
        />
      </div>
    </ExpandableElement>
  </div>;
}



export const styleSheetPaths = [
  ...ExpandableElement.styleSheetPaths,
  abs("./GeneralEntityElement.css"),
  abs("../misc/ExpandableElement.css"),
];