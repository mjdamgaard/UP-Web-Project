
import * as ArgumentContentPage
from "../entity_pages/subpages/ArgumentContentPage.jsx";
import * as EntityReference from "../misc/EntityReference.jsx";



export function render({
  entID, entKey = entID, subjScalarKey = entKey, objScalarKey
}) {
  return <div className="entity-element">
    <h2><EntityReference key="r" entKey={subjScalarKey} /></h2>
    <ArgumentContentPage key="c"
      subjScalarKey={subjScalarKey} objScalarKey={objScalarKey}
    />
  </div>;
}


export const styleSheetPaths = [
  abs("./GeneralEntityElement.css"),
  abs("../scoring/AggregatedScoreDisplay.css"),
];