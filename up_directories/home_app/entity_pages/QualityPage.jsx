
import * as EntityPageWithTabs from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage from "./subpages/EntityMetadataPage.jsx";
import * as QualitiesPage from "./subpages/QualitiesPage.jsx";
import * as CommentsPage from "./subpages/CommentsPage.jsx";
import * as EntityList from "../entity_lists/EntityList.jsx";

const commentsRel = "/1/1/em1.js;get/commentsRelation";
const discussionsRel = "/1/1/em1.js;get/discussions";
const tasksRel = "/1/1/em1.js;get/tasks";


export function render({entKey, extQualKeyArr = undefined, isNested = false}) {
  return <EntityPageWithTabs key="0"
    entKey={entKey} initTabKey={"about"} isNested={isNested} tabs={{
      about: {
        title: "About",
        Component: EntityMetadataPage,
        props: {entKey: entKey}
      },
      qualities: {
        title: "Qualities",
        Component: QualitiesPage,
        props: {
          objKey: entKey,
          extQualKeyArr: extQualKeyArr,
        }
      },
      subjects: {
        title: "Subjects",
        Component: EntityList,
        props: {
          qualKey: entKey,
        },
      },
      comments: {
        title: "Comments",
        Component: CommentsPage,
        props: {
          entKey: entKey,
          isNested: true,
        },
      },
      discussions: {
        title: "Discussions",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: discussionsRel,
          extQualKeyArr: [[entKey, discussionsRel]],
          otherExtQualKeyArr: [[entKey, commentsRel]],
        },
      },
      tasks: {
        title: "Tasks",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: tasksRel,
          extQualKeyArr: [[entKey, tasksRel]],
          otherExtQualKeyArr: [[entKey, commentsRel]],
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