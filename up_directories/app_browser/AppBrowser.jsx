
import {join} from 'string';
import {indexOf, slice, at, reduce} from 'array';
import {hasType} from 'type';
import {fetchEntityID} from "../semantic_entities/entities.js";
import * as AppCategoryPage from "./src/AppCategoryPage.jsx";
import * as AppPage from "./src/AppPage.jsx";
import * as MissingPage from "../base_app/src/MissingPage.jsx";

const missingPageJSX = <div className="app-browser">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="app-browser">
  <div className="fetching"></div>
</div>;

// The entity path of the general 'Apps' class.
const appsClassEntPath = abs("~/../semantic_entities/em3.js;get/apps");



// The URL API for this app browser prototype is that the (tail) URLs of "" and
// "/apps" both redirect to the default app category page. And category/class
// pages have URLs of the form '/apps/cat(/<entID>)+', and app pages have URLs
// of the form '/apps(/cat(/<entID>)+)?/app/(/<entID>)+'. And if the URL ends
// in '/path<entPath>', we query for the corresponding entity ID (entID) and
// redirect to the URL that ends in '/<entID>' instead.


export function initialize() {
  return {entIDIsMissing: undefined, curEntPathRef: new MutableArray()};
}

export function render() {
  let [segment1, segment2, ...restSegments] = this.getSegments();

  // If the tail URL is empty, or if the second segment is empty, redirect to
  // "~/apps/cat/path" + appsClassEntPath.
  if (!segment1 || segment1 === "apps" && !segment2) {
    this.replaceURL("~/apps/cat/path" + appsClassEntPath);
    return fetchingPageJSX;
  }

  // We here use a convention of using a constant first segment that signals
  // what kind of app the URL points to. And we choose 'apps' to be the
  // constant segment for this app browser. (And sub-apps ought to use the same
  // convention unless they start to implement other kinds of apps as well.)
  if (segment1 !== "apps" || segment2 !== "app" && segment2 !== "cat") {
    return missingPageJSX;
  }

  // If the URL is of the form '/apps/.../path<entPath>', fetch the
  // corresponding entity ID, and replace the URL.
  let indOfPathSegment = indexOf(restSegments, "path");
  if (indOfPathSegment !== -1) {
    let {entIDIsMissing, curEntPathRef} = this.state;
    let entPath = "/" + join(slice(restSegments, indOfPathSegment + 1), "/");
    if (curEntPathRef[0] === entPath && entIDIsMissing) {
      return missingPageJSX;
    }
    curEntPathRef[0] = entPath;
    fetchEntityID(entPath).then(entID => {
      if (entID) {
        this.replaceURL(
          "~/apps/" + segment2 + "/" +
          join(slice(restSegments, 0, indOfPathSegment), "/") + "/" + entID
        );
      } else if (curEntPathRef[0] === entPath) {
        this.setState(state => ({...state, entIDIsMissing: true}))
      }
    });
    return fetchingPageJSX;
  }

  // And if it is of the form '/apps(/cat(/<entID>)+)?/app/(/<entID>)+', or
  // '/apps/cat(/<entID>)+' parse the ancestor category IDs, the ancestor app
  // IDs, and the final entity ID in the URL.
  let type, ancCatIDs = [], ancAppIDs = [];
  let entID = at(restSegments, -1);
  if (segment2 === "app") {
    type = "app";
    ancAppIDs = slice(restSegments, 0, -1);
  }
  else {
    let indOfAppSegment = indexOf(restSegments, "app");
    if (indOfAppSegment === -1) {
      type = "cat";
      ancCatIDs = slice(restSegments, 0, -1);
    }
    else {
      type = "app";
      ancCatIDs = slice(restSegments, 0, indOfAppSegment);
      ancAppIDs = slice(restSegments, indOfAppSegment + 1, -1);
    }
  }

  // Then validate the extracted entity IDs.
  let isValid = hasType(entID, "hex") && reduce(
    ancCatIDs, (acc, val) => acc && hasType(val, "hex"),
    true
  ) && reduce(
    ancAppIDs, (acc, val) => acc && hasType(val, "hex"),
    true
  );
  if (!isValid) {
    console.error(
      "Encountered a non-hexadecimal segment in the URL when expecting an " +
      "entity ID"
    );
    return missingPageJSX;
  }

  if (type === "app") {
    return <div className="app-browser">
      <AppPage key="a" entID={entID}
        ancCatIDs={ancCatIDs} ancAppIDs={ancAppIDs}
      />
    </div>;
  }
  else {
    return <div className="app-browser">
      <AppCategoryPage key="c" entID={entID}
        ancCatIDs={ancCatIDs} ancAppIDs={ancAppIDs}
      />
    </div>;
  }
}
