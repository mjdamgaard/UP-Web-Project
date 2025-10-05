
import * as EntityList from "../utility_components/EntityList.jsx";
import * as EntityMetadataPage from "./EntityMetadataPage.jsx";
import * as GeneralEntityElement
from "../entity_elements/GeneralEntityElement.jsx";

const subclassesRel = "/1/1/em1.js;get/subclasses";


export function render({entKey}) {
  return (
    <EntityMetadataPage key="0" initTabKey={"members"} />
  );
}
