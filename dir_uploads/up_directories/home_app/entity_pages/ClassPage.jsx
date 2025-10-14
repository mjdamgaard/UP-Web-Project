
import * as EntityReference from "../utility_components/EntityReference.jsx";
import * as TabbedPages from "../utility_components/TabbedPages.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as EntityList from "../utility_components/EntityList.jsx";
import * as GeneralEntityElement 
from "../entity_elements/GeneralEntityElement.jsx";

const subclassesRel = "/1/1/em1.js;get/subclasses";


export function render({entKey}) {
  return <div className="entity-page">
    <h1>
      <EntityReference key={"title"} entKey={entKey} isLink={false} />
    </h1>
    <TabbedPages key={"tp-" + entKey} initTabKey="members" tabs={{
      about: {
        title: "About", Component: EntityMetadataPage, props: {entKey: entKey}
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
      test: {
        title: "Test",
        Component: EntityReference,
        props: {
          entKey: entKey,
        }
      },
    }}/>
  </div>;
}



export const styleSheetPaths = [
  abs("../utility_components/TabbedPages.css"),
];