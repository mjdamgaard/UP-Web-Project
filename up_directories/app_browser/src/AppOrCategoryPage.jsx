
import {fetchEntityDefinition} from "../../semantic_entities/entities.js";
import {fetchList} from "../server/entity_lists.sm.js";
import * as PageHeader from "./PageHeader.jsx";
import * as AppList from "./AppList.jsx";
import * as MissingPage from "../../base_app/src/MissingPage.jsx";

const missingPageJSX = <div className="app-category-page">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="app-category-page">
  <div className="fetching"></div>
</div>;

const membersRelPath = abs("~/../semantic_entities/em1.js;get/members");
const versionsRelPath = abs("~/../semantic_entities/em3.js;get/versionsRel");


export const keyProps = ["entID"];

export function initialize({entID, type}) {
  let relKey = (type === "cat") ? membersRelPath : versionsRelPath;
  fetchEntityDefinition(entID, ["Name", "Description"]).then(entDef => {
    this.setState({entDef: entDef ?? null})
  });
  fetchList(entID, relKey).then(list => {
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


export const actions = {
  "goToAppPage": function(appEntID) {
    let {type} = this.props;
    if (type === "cat") {
      this.pushURL("./app/" + appEntID);
    } else {
      this.pushURL("./" + appEntID);
    }
  },
  "goToCatPage": function(catEntID) {
    let {type} = this.props;
    if (type === "cat") {
      this.pushURL("./" + catEntID);
    } else {
      this.pushURL("~/cat/" + catEntID);
    }
  },
};

export const events = [
  "goToAppPage",
  "goToCatPage",
];