
import * as EntityPageWithTabs from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as QualitiesPage from "./QualitiesPage.jsx";
import * as EntityList from "../entity_lists/EntityList.jsx";
import * as GeneralEntityElement 
from "../entity_elements/GeneralEntityElement.jsx";

const membersRel = "/1/1/em1.js;get/members";
const subclassesRel = "/1/1/em1.js;get/subclasses";
const discussionsRel = "/1/1/em1.js;get/discussions";
const tasksRel = "/1/1/em1.js;get/tasks";


export function render({entKey, extQualKeyArr = undefined, isNested = false}) {
  extQualKeyArr ??= this.subscribeToContext("extQualKeyArr") ?? [];
  return <EntityPageWithTabs key="0"
    entKey={entKey} initTabKey={isNested ? "subclasses" : "members"}
    isNested={isNested} tabs={{
      about: {
        title: "About",
        Component: EntityMetadataPage,
        props: {entKey: entKey}
      },
      members: {
        title: "Members",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: membersRel,
          extQualKeyArr: [[entKey, membersRel]],
          ElementComponent: GeneralEntityElement,
        }
      },
      subclasses: {
        title: "Subclasses",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: subclassesRel,
          extQualKeyArr: [[entKey, subclassesRel]],
          ElementComponent: GeneralEntityElement,
        },
      },
      qualities: {
        title: "Qualities",
        Component: QualitiesPage,
        props: {
          objKey: entKey,
          extQualKeyArr: extQualKeyArr,
        }
      },
      discussions: {
        title: "Discussions",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: discussionsRel,
          extQualKeyArr: [[entKey, discussionsRel]],
        },
      },
      tasks: {
        title: "Tasks",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: tasksRel,
          extQualKeyArr: [[entKey, tasksRel]],
        },
      },
    }}
  />;
}



export const styleSheetPaths = [
  abs("../misc/TabbedPages.css"),
  abs("../entity_lists/EntityList.css"),
];