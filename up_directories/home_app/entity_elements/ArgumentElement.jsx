
import * as EntityPageWithTabs
from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as ArgumentContentPage from "./ArgumentContentPage.jsx";
import * as QualitiesPage from "./QualitiesPage.jsx";
import * as EntityList from "../entity_lists/EntityList.jsx";

const commentsRel = "/1/1/em1.js;get/commentsRelation";
const discussionsRel = "/1/1/em1.js;get/discussions";
const tasksRel = "/1/1/em1.js;get/tasks";


export function render({entKey, extQualKeyArr = undefined, isNested = false}) {
  return <EntityPageWithTabs key="0"
    entKey={entKey} initTabKey={"content"} isNested={isNested} tabs={{
      about: {
        title: "About",
        Component: EntityMetadataPage,
        props: {entKey: entKey, extQualKeyArr: extQualKeyArr}
      },
      content: {
        title: "Content",
        Component: ArgumentContentPage,
        props: {entKey: entKey, extQualKeyArr: extQualKeyArr}
      },
      qualities: {
        title: "Qualities",
        Component: QualitiesPage,
        props: {
          objKey: entKey,
          extQualKeyArr: extQualKeyArr,
        }
      },
      comments: {
        title: "Comments",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: commentsRel,
          extQualKeyArr: [[entKey, commentsRel]],
        },
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
  abs("../misc/EntityPageWithTabs.css"),
  abs("../misc/TabbedPages.css"),
  abs("../entity_lists/EntityList.css"),
];