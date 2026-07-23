
import {fetchEntityDefinition, fetchEntityID} from
  "~/../semantic_entities/entities.js";
import {fetchList} from "../server/entity_lists.sm.js";
import * as PageHeader from "./PageHeader.jsx";
import * as MissingPage from "~/../base_app/src/MissingPage.jsx";

const missingPageJSX = <div className="app-page">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="app-page">
  <div className="fetching"></div>
</div>;

const versionsRelIDProm = fetchEntityID(
  abs("~/../semantic_entities/em3.js;get/versionsRel")
);


export const keyProps = ["entID"];

export function initialize({entID}) {
  fetchEntityDefinition(entID, ["Name", "Description"]).then(entDef => {
    this.setState({entDef: entDef})
  }).catch(err => {
    console.error("Missing or invalid entity path for entity #" + entID + ":");
    console.error(err);
    this.setState({entDef: null})
  });
  versionsRelIDProm.then(versionsRelID => {
    fetchList(entID, versionsRelID).then(list => {
      this.setState(state => ({...state, list: list}))
    });
  });
}

export function render(props) {
  let {entID, ancCatIDs, ancAppIDs} = props;
  let {entDef, list} = this.state;
  if (entDef === undefined || list === undefined) {
    return fetchingPageJSX;
  }
  else if (entDef === null) {
    return missingPageJSX;
  }

  return <div className="app-page">
    <PageHeader key="h" {...props} entDef={entDef} />
    <AppList key="l" list={list} objID={entID}
      ancCatIDs={ancCatIDs} ancAppIDs={[...ancAppIDs, entID]}
    />
  </div>;

}