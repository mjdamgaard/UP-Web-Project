
import {fetchEntityDefinition} from "../../semantic_entities/entities.js";
import * as TabbedPages from "../../utilities/TabbedPages.jsx";
import * as MissingPage from "../../base_app/src/MissingPage.jsx";
import * as PageHeader from "./PageHeader.jsx";
import * as EntityList from "./EntityList.jsx";
import * as EntityElement from "./EntityElement.jsx";
import * as InfoPage from "./InfoPage.jsx";
import * as SubmissionPage from "./submissions/SubmissionPage.jsx";

const missingPageJSX = <div className="entity-page">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="entity-page">
  <div className="loading"></div>
</div>;

const membersRelPath = abs("~/../semantic_entities/em1.js;get/members");
const subclassesRelPath = abs("~/../semantic_entities/em1.js;get/subclasses");
const versionsRelPath = abs("~/../semantic_entities/em3.js;get/versionsRel");


export const keyProps = ["entID"];

export async function initialize({entID, type}) {
  let entDef = await fetchEntityDefinition(entID, ["Name", "Description"])
    .catch(err => console.error(err));
  this.setState({entDef: entDef ?? null});
}

export function render(props) {
  let {entID, type, ancCatIDs = [], ancAppIDs = []} = props;
  let {entDef} = this.state;
  if (entDef === undefined) {
    return fetchingPageJSX;
  }
  else if (entDef === null) {
    return missingPageJSX;
  }

  let content = (type === "cat") ? <TabbedPages key="c"
    initTabKey={"members"} tabs={{
      info: {
        title: "Info",
        Component: InfoPage,
        props: {entID: entID, entDef: entDef},
      },
      members: {
        title: "Members",
        Component: EntityList,
        props: {
          objKey: entID, relKey: membersRelPath,
          Element: EntityElement, elemProps: {
            type: "app",
            ancCatIDs: [...ancCatIDs, entID],
          },
        },
      },
      subcategories: {
        title: "Subcategories",
        Component: EntityList,
        props: {
          objKey: entID, relKey: subclassesRelPath,
          Element: EntityElement, elemProps: {
            type: "cat",
            ancCatIDs: [...ancCatIDs, entID],
          },
        },
      },
      submit: {
        title: "Submit",
        Component: SubmissionPage,
        props: {entID: entID, type: type},
      },
    }}
  /> : <TabbedPages key="c"
    initTabKey={"versions"} tabs={{
      info: {
        title: "Info",
        Component: InfoPage,
        props: {entID: entID, entDef: entDef},
      },
      versions: {
        title: "Versions",
        Component: EntityList,
        props: {
          objKey: entID,
          relKey: versionsRelPath,
          Element: EntityElement, elemProps: {
            type: "app",
            ancCatIDs: ancCatIDs,
            ancAppIDs: [...ancAppIDs, entID],
          },
        },
      },
      submit: {
        title: "Submit",
        Component: SubmissionPage,
        props: {entID: entID, type: type},
      },
    }}
  />;

  return <div className="entity-page hide-loading">
    <PageHeader key="h" {...props} entDef={entDef} />
    {(content)}
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