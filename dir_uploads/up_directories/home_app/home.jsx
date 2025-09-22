
// import * as EntityPage from "./EntityPage.jsx";
import * as EntityList from "./utility_components/EntityList.jsx";
import * as DefaultEntityElement
from "./entity_elements/DefaultEntityElement.jsx";
import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";
import {fetchEntityDefinition} from "/1/1/entities.js";

const trustedQualKey = "/1/1/em1.js;get/trusted";


export function render(props) {
  return (
    // <EntityPage key="0" {...props} />
    <EntityList key="0" qualKey={trustedQualKey}
      scoreHandler={scoreHandler01} ElementComponent={DefaultEntityElement}
    />
  );
}
