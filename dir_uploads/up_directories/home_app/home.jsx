
// import * as EntityPage from "./EntityPage.jsx";
import * as EntityList from "./utility_components/EntityList.jsx";
import * as GeneralEntityElement
from "./entity_elements/GeneralEntityElement.jsx";
import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";
import {fetchEntityDefinition} from "/1/1/entities.js";

const trustedQualKey = "/1/1/em1.js;get/trusted";


export function render(props) {
  return (
    // <EntityPage {...props} key="0" />
    <EntityList key="0" qualKey={trustedQualKey}
      scoreHandler={scoreHandler01} ElementComponent={GeneralEntityElement}
    />
  );
}
