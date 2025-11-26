
import * as EntityReference from "../misc/EntityReference.jsx";
import * as ExpandableElement
from "../misc/ExpandableElement.jsx";
import * as ScoreInterface from "../scoring/ScoreInterface.jsx";


export function render({entID, qualKey = entID, objKey: subjKey}) {
  return <div className="entity-element">
    <ExpandableElement key="ee"
      ExpandedComponent={ScoreInterface} expCompProps={{
        subjKey: subjKey,
        qualKey: qualKey,
      }}
    >
      <div onClick={() => this.call("ee", "expand")}>
        <div className="entity-display">
          <EntityReference key="er" entKey={qualKey} hasLinks={false} />
        </div>
        {"TODO: Insert fetched score here."}
      </div>
    </ExpandableElement>
  </div>;
}



export const styleSheetPaths = [
  ...ExpandableElement.styleSheetPaths,
  abs("./GeneralEntityElement.css"),
  abs("../misc/ExpandableElement.css"),
];