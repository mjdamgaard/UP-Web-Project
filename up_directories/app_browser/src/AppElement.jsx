
import {fetchEntityDefinition} from "../../semantic_entities/entities.js";
import * as ILink from 'ILink';

const missingJSX = <div className="app-element">
  Missing data
</div>;
const fetchingJSX = <div className="app-element">
  <div className="fetching"></div>
</div>;


export function initialize({entID}) {
  fetchEntityDefinition(entID, ["Name", "Description"]).then(entDef => {
    this.setState({entDef: entDef ?? null})
  });
}

export function render({entID}) {
  let {entDef} = this.state;
  if (entDef === undefined) {
    return fetchingJSX;
  }
  if (entDef === null) {
    return missingJSX;
  }
  let appDirID = entDef["App directory ID"];
  return <div className="app-element">
    <div className="main-area clickable"
      onClick={() => this.trigger("goToApp", [appDirID])}
    >
      <span className="title">{entDef["Name"]}</span>
    </div>
    <div className="info-area">
      <div className="app-page-link clickable"
        onClick={() => this.trigger("goToAppPage", entID)}
      >
        Info
      </div>
    </div>
  </div>;
}