
// import * as EntityPage from "./EntityPage.jsx";
import * as EntityList from "./utility_components/EntityList.jsx";
import * as DefaultEntityElement
from "./entity_elements/DefaultEntityElement.jsx";
import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";

const trustedQualKey = "/1/1/em1.js;get/trusted";


export function render(props) {
  let [a, b, c, ...rest] = [1,2,3,4,5,6,7];
  console.log([a, b, c, rest]);
  [a, b, c, , , ...rest] = [1,2,3,4,5,6,7];
  console.log([a, b, c, rest]);
  return (
    // <EntityPage key="0" {...props} />
    <EntityList key="0" qualKey={trustedQualKey}
      scoreHandler={scoreHandler01} ElementComponent={DefaultEntityElement}
    />
  );
}
