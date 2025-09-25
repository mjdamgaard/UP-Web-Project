
import * as EntityList from "../utility_components/EntityList.jsx";
import * as TabbedPages from "../utility_components/TabbedPages.jsx";
import * as DefaultEntityElement
from "../entity_elements/DefaultEntityElement.jsx";

const subclassesRel = "/1/1/em1.js;get/subclasses";


export function render({entKey}) {
  return (
    <TabbedPages key="0" initTabKey={"members"} tabs={{
      members: {
        title: "Members",
        Component: EntityList,
        props: {
          classKey: entKey,
          ElementComponent: DefaultEntityElement,
        }
      },
      subclasses: {
        title: "Subclasses",
        Component: EntityList,
        props: {
          relKey: subclassesRel,
          objKey: entKey,
          ElementComponent: DefaultEntityElement,
        },
      },
    }}/>
  );
}
