
import {fetchEntityDefinition} from "../../semantic_entities/entities.js";
import * as ExtRatingDisplay from "./ratings/ExtRatingDisplay.jsx";

const missingJSX = <div className="app-element">
  Missing data
</div>;
const fetchingJSX = <div className="app-element">
  <div className="loading"></div>
</div>;


export function initialize({entID}) {
  fetchEntityDefinition(entID, ["Name", "App directory ID"]).then(entDef => {
    this.setState({entDef: entDef ?? null})
  });
}

export function render(props) {
  let {entID, type, objID, relID, ancCatIDs, ancAppIDs} = props;
  let {entDef} = this.state;
  if (entDef === undefined) {
    return fetchingJSX;
  }
  if (entDef === null) {
    return missingJSX;
  }

  let appDirID = entDef["App directory ID"];
  return <div className="entity-element">
    <div className="main-area" 
      onClick={() => this.do("followMainLink")}
    >
      <span className="title">{entDef["Name"]}</span>
    </div>
    <div className="info-area">
      <div className="entity-page-link">
        <button onClick={() => this.do("goToEntityPage")}>
          ≡
        </button>
      </div>
      <ExtRatingDisplay key="r"
        entID={entID} entDef={entDef} type={type} objID={objID} relID={relID}
        ancAppIDs={ancAppIDs}
      />
    </div>
  </div>;
}


export const actions = {
  "followMainLink": function() {
    let {entID, type} = this.props;
    let {entDef} = this.state;
    if (type === "app") {
      this.trigger("goToApp", entDef["App directory ID"]);
    } else {
      this.trigger("goToCatPage", entID);
    }
  },
  "goToEntityPage": function() {
    let {entID, type} = this.props;
    if (type === "app") {
      this.trigger("goToAppPage", entID);
    } else {
      this.trigger("goToCatPage", entID);
    }
  },
};