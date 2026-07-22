
import {join} from 'string';
import {hasType} from 'type';
import {fetchEntityID} from "~/../semantic_entities/entities.js";
import * as AppCategoryPage from "./src/AppCategoryPage.jsx";
import * as AppPage from "./src/AppPage.jsx";
import * as MissingPage from "~/../base_app/src/MissingPage.jsx";

const missingPageJSX = <div className="app-browser">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="app-browser">
  <div className="fetching"></div>
</div>;

// The entity path of the general 'Apps' class.
const appsClassEntPath = abs("~/../semantic_entities/em3.js;get/apps");


// The URL API for this app browser prototype is that the (tail) URLs of "" and
// "/apps" both redirect to the default app category page. And the URLs for
// apps and category pages of the form '/apps/(c|a)/(<entID>|path<entPath>)',
// where the "a" denote an app page and the "c" denote a category/class. And if
// the URL ends in '/path<entPath>', we query for the corresponding entity ID
// (entID) and redirect to the URL that ends in '/<entID>' instead.

export function initialize() {
  return {entIDIsMissing: undefined, curEntPathRef: new MutableArray()};
}


export function render() {
  let [segment1, segment2, segment3, ...restSegments] = this.getSegments();

  // If the tail URL is empty, or if the second segment is empty, redirect to
  // "~/apps/cat/path" + appsClassEntPath.
  if (!segment1 || segment1 === "apps" && !segment2) {
    this.replaceURL("~/apps/c/path" + appsClassEntPath);
    return fetchingPageJSX;
  }

  // We here use a convention of using a constant first segment that signals
  // what kind of app the URL points to. And we choose 'apps' to be the
  // constant segment for this app browser. (And sub-apps ought to use the same
  // convention unless they start to implement other kinds of apps as well.)
  if (segment1 !== "apps" || segment2 !== "a" && segment2 !== "c") {
    return missingPageJSX;
  }

  // If the URL is of the form '/apps/(c|a)/path<entPath>', fetch the
  // corresponding entity ID, and replace the URL.
  if (segment3 === "path") {
    let {entIDIsMissing, curEntPathRef} = this.state;
    let entPath = "/" + join(restSegments, "/");
    if (curEntPathRef[0] === entPath && entIDIsMissing) {
      return missingPageJSX;
    }
    curEntPathRef[0] = entPath;
    fetchEntityID(entPath).then(entID => {
      if (entID) {
        this.replaceURL("~/apps/" + segment2 + "/" + entID);
      } else if (curEntPathRef[0] === entPath) {
        this.setState(state => ({...state, entIDIsMissing: true}))
      }
    });
    return fetchingPageJSX;
  }

  // Else if URL is of the form '/apps/(c|a)/<entID>', validate entID, then
  // render either an AppPage or an AppCategoryPage depending on the type.
  let entID = segment3;
  if (!hasType(entID, "hex")) {
    return missingPageJSX;
  }
  if (segment2 === "a") {
    return <div className="app-browser">
      <AppPage key="a" entID={entID} />
    </div>;
  }
  else {
    return <div className="app-browser">
      <AppCategoryPage key="c" entID={entID} />
    </div>;
  }
}

