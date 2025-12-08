
import * as EntityPageWithTabs from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage
from "../entity_pages/subpages/EntityMetadataPage.jsx";
import * as ArgumentContentPage from "./ArgumentContentPage.jsx";
import * as TextQualitiesPage
from "../entity_pages/subpages/TextQualitiesPage.jsx";
import * as CommentsPage from "../entity_pages/subpages/CommentsPage.jsx";
import * as EntityList from "../entity_lists/EntityList.jsx";

const commentsRel = "/1/1/em1.js;get/commentsRelation";
const discussionsRel = "/1/1/em1.js;get/discussions";
const tasksRel = "/1/1/em1.js;get/tasks";


export function render({
  entID, entKey = entID, subjScalarKey = entKey, objScalarKey,
  extQualKeyArr = undefined
}) {
  return <EntityPageWithTabs key="0"
    entKey={entKey} initTabKey={"content"} isNested={true} tabs={{
      about: {
        title: "About",
        Component: EntityMetadataPage,
        props: {entKey: entKey},
      },
      content: {
        title: "Content",
        Component: ArgumentContentPage,
        props: {
          subjScalarKey: subjScalarKey,
          objScalarKey: objScalarKey,
        },
      },
      qualities: {
        title: "Qualities",
        Component: TextQualitiesPage,
        props: {
          objKey: entKey,
          extQualKeyArr: extQualKeyArr,
        }
      },
      arguments: {
        title: "Arguments",
        Component: CommentsPage,
        props: {
          entKey: entKey,
          isNested: true,
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