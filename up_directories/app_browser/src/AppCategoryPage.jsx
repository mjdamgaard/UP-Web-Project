
import {fetchEntityDefinition} from
  "../../semantic_entities/entities.js";
import {fetchList} from "../server/entity_lists.sm.js";
import * as PageHeader from "./PageHeader.jsx";
import * as AppList from "./AppList.jsx";
import * as MissingPage from "../../base_app/src/MissingPage.jsx";

const missingPageJSX = <div className="app-page">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="app-page">
  <div className="fetching"></div>
</div>;

const membersRelPath = abs("~/../semantic_entities/em1.js;get/members");


export const keyProps = ["entID"];

export function initialize({entID}) {
  fetchEntityDefinition(entID, ["Name", "Description"]).then(entDef => {
    this.setState({entDef: entDef})
  }).catch(err => {
    console.error("Missing or invalid entity path for entity #" + entID + ":");
    console.error(err);
    this.setState({entDef: null})
  });
  fetchList(entID, membersRelPath).then(list => {
    this.setState(state => ({...state, list: list}))
  });
}

export function render(props) {
  let {entID, ancCatIDs = []} = props;
  let {entDef, list} = this.state;
  if (entDef === undefined || list === undefined) {
    return fetchingPageJSX;
  }
  else if (entDef === null) {
    return missingPageJSX;
  }

  return <div className="app-category-page">
    <PageHeader key="h" {...props} entDef={entDef} />
    <hr/>
    <AppList key="l" list={list} objID={entID}
      ancCatIDs={[...ancCatIDs, entID]}
    />
  </div>;
}