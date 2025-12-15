
import * as CommentDisplay from "../misc/CommentDisplay.jsx";
import * as ExpandableElement from "./ExpandableElement.jsx";
import * as EntityPage from "../variable_components/EntityPage.jsx";

import * as AggregatedScoreDisplay from "../scoring/AggregatedScoreDisplay.jsx";



export function render({
  entID, extQualKeyArr = undefined, score = undefined, weight = undefined,
  startOpen = false,
}) {
  return <div className="entity-element">
    <ExpandableElement key="ee" startOpen={startOpen}
      ExpandedComponent={EntityPage} expCompProps={{
        key: "_exp",
        entKey: entID,
        extQualKeyArr: extQualKeyArr,
        isNested: true,
      }}
    >
      <div onClick={() => this.call("ee", "expand")}>
        <CommentDisplay key="text" entKey={entID} />
        <AggregatedScoreDisplay key="as" score={score} weight={weight} />
      </div>
    </ExpandableElement>
  </div>;
}



export const styleSheets = [
  ...ExpandableElement.styleSheets,
  abs("./GeneralEntityElement.css"),
  abs("../scoring/AggregatedScoreDisplay.css"),
];