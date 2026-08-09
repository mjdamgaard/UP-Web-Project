
import * as TabbedPages from "../../../utilities/TabbedPages.jsx";
import * as AppSubmissionPage from "./AppSubmissionPage.jsx";
import * as CategorySubmissionPage from "./CategorySubmissionPage.jsx";

const membersRelPath = abs("~/../semantic_entities/em1.js;get/members");
const subclassesRelPath = abs("~/../semantic_entities/em1.js;get/subclasses");
const versionsRelPath = abs("~/../semantic_entities/em3.js;get/versionsRel");


export function render({entID, type}) {
  return <div>
    {((type === "cat") ?
      <TabbedPages key="0" initTabKey={"app"} tabs={{
        app: {
          title: "Submit app",
          Component: AppSubmissionPage,
          props: {objID: entID, relKey: membersRelPath, objType: type},
        },
        cat: {
          title: "Submit subcategory",
          Component: CategorySubmissionPage,
          props: {objID: entID, relKey: subclassesRelPath},
        },
      }}/> :
      <AppSubmissionPage key="0"
        objID={entID} relKey={versionsRelPath} objType={type}
      />
    )}
  </div>;
}