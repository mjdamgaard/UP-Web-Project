
import * as EntityReference from "../misc/EntityReference.jsx";
import * as ExpandableElement from "./ExpandableElement.jsx";
import * as ScoreInterface from "../scoring/ScoreInterface.jsx";
import * as AggregatedScoreDisplay from "../scoring/AggregatedScoreDisplay.jsx";


export function render({
  entID, qualKey = entID, objKey: subjKey, startOpen = false,
}) {
  return <div className="entity-element">
    <ExpandableElement key="ee" startOpen={startOpen}
      ExpandedComponent={ScoreInterface} expCompProps={{
        key: "_si",
        subjKey: subjKey,
        qualKey: qualKey,
      }}
    >
      <div onClick={() => this.call("ee", "expand")}>
        <div className="entity-display">
          <EntityReference key="er" entKey={qualKey} hasLinks={false} />
        </div>
        <AggregatedScoreDisplay key="asd" qualKey={qualKey} subjKey={subjKey} />
      </div>
    </ExpandableElement>
  </div>;
}



export const styleSheets = [
  ...ExpandableElement.styleSheets,
  abs("./GeneralEntityElement.css"),
  abs("../scoring/AggregatedScoreDisplay.css"),
  abs("../entity_elements/ExpandableElement.css"),
];