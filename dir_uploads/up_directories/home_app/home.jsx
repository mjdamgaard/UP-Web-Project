
// import * as EntityPage from "./EntityPage.jsx";
import * as EntityList from "./utility_components/EntityList.jsx";
import * as DefaultEntityElement
from "./entity_elements/DefaultEntityElement.jsx";
import {scoreHandler01} from "/1/1/score_handling/ScoreHandler01/em.js";

const trustedQualKey = "/1/1/em1.js;get/trusted";


export function render(props) {
  function foo(x, y) {
    console.log(x, y);
    console.trace();
  }
  function bar(x, y) {
    const baz = x => {
      return foo(x, x);
    };
    return baz(x + y);
  }
  bar(1, 2);
  return (
    // <EntityPage key="0" {...props} />
    <EntityList key="0" qualKey={trustedQualKey}
      scoreHandler={scoreHandler01} ElementComponent={DefaultEntityElement}
    />
  );
}
