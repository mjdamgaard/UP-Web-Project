
import * as EntityPageWithTabs from "../misc/EntityPageWithTabs.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as EntityList from "../entity_lists/EntityList.jsx";
import * as GeneralEntityElement 
from "../entity_elements/GeneralEntityElement.jsx";

const subclassesRel = "/1/1/em1.js;get/subclasses";


export function render({entKey, isNested}) {
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
          classKey: entKey,
          ElementComponent: GeneralEntityElement,
        }
      },
      subclasses: {
        title: "Subclasses",
        Component: EntityList,
        props: {
          relKey: subclassesRel,
          objKey: entKey,
          ElementComponent: GeneralEntityElement,
        },
      },
    }}
  />;
}



export const styleSheetPaths = [
  abs("../misc/TabbedPages.css"),
  abs("../entity_lists/EntityList.css"),
];