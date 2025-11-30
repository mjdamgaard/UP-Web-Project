
import {toPrecision} from 'number';

import * as EntityReference from "../misc/EntityReference.jsx";
import * as ExpandableElement
from "./ExpandableElement.jsx";
import * as EntityPage from "../variable_components/EntityPage.jsx";

import * as AggregatedScoreDisplay from "../scoring/AggregatedScoreDisplay.jsx";



export function render({
  entID, extQualKeyArr = undefined, score = undefined, weight = undefined,
}) {
  return <div className="entity-element">
    <ExpandableElement key="ee"
      ExpandedComponent={EntityPage} expCompProps={{
        key: "_exp",
        entKey: entID,
        extQualKeyArr: extQualKeyArr,
        isNested: true,
      }}
    >
      <div onClick={() => this.call("ee", "expand")}>
        <div className="entity-display">
          <EntityReference key="er" entKey={entID} hasLinks={false} />
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
  abs("../entity_elements/ExpandableElement.css"),
];