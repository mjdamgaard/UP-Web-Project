
import * as TabbedPages from "../../misc/TabbedPages.jsx";
import * as EntityList from "../../entity_lists/EntityList.jsx";

const commentsRel = "/1/1/em1.js;get/commentsRelation";
const reactionsRel = "/1/1/em1.js;get/reactions";
const questionsAndFactsRel = "/1/1/em1.js;get/questionsAndFacts";
const discussionsRel = "/1/1/em1.js;get/discussions";
const tasksRel = "/1/1/em1.js;get/tasks";


export function render({entKey, isNested = false}) {
  return <TabbedPages key="0"
    initTabKey={"all"} isNested={isNested} tabs={{
      all: {
        title: "All",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: commentsRel,
          extQualKeyArr: [[entKey, commentsRel]],
        },
      },
      reactions: {
        title: "Reactions",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: reactionsRel,
          extQualKeyArr: [[entKey, reactionsRel]],
          otherExtQualKeyArr: [[entKey, commentsRel]],
        },
      },
      questionsAndFacts: {
        title: "Q&F",
        Component: EntityList,
        props: {
          objKey: entKey,
          relKey: questionsAndFactsRel,
          extQualKeyArr: [[entKey, questionsAndFactsRel]],
          otherExtQualKeyArr: [[entKey, commentsRel]],
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