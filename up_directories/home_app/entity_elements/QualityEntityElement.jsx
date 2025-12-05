
import * as EntityReference from "../misc/EntityReference.jsx";
import * as ExpandableElement from "./ExpandableElement.jsx";
import * as ScoreInterface from "../scoring/ScoreInterface.jsx";


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
        {"TODO: Insert fetched score here."}
      </div>
    </ExpandableElement>
  </div>;
}



export const styleSheetPaths = [
  ...ExpandableElement.styleSheetPaths,
  abs("./GeneralEntityElement.css"),
  abs("../entity_elements/ExpandableElement.css"),
];