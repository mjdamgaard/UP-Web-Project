
import {hasType} from 'type';
import {fetchEntityID} from "../semantic_entities/entities.js";
import * as EntityPage from "./src/EntityPage.jsx";
import * as MissingPage from "../base_app/src/MissingPage.jsx";

const missingPageJSX = <div className="app-browser">
  <MissingPage key="m" />
</div>;
const fetchingPageJSX = <div className="app-browser">
  <div className="loading"></div>
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
  let indOfPathSegment = restSegments.indexOf("path");
  if (indOfPathSegment !== -1) {
    let {entIDIsMissing, curEntPathRef} = this.state;
    let entPath = "/" + restSegments.slice(indOfPathSegment + 1).join("/");
    if (curEntPathRef[0] === entPath && entIDIsMissing) {
      return missingPageJSX;
    }
    curEntPathRef[0] = entPath;
    fetchEntityID(entPath).then(entID => {
      if (entID) {
        this.replaceURL(
          "~/apps/" + segment2 + "/" +
          restSegments.slice(0, indOfPathSegment).join("/") + "/" + entID
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
  let entID = restSegments.at(-1);
  if (segment2 === "app") {
    type = "app";
    ancAppIDs = restSegments.slice(0, -1);
  }
  else {
    let indOfAppSegment = restSegments.indexOf("app");
    if (indOfAppSegment === -1) {
      type = "cat";
      ancCatIDs = restSegments.slice(0, -1);
    }
    else {
      type = "app";
      ancCatIDs = restSegments.slice(0, indOfAppSegment);
      ancAppIDs = restSegments.slice(indOfAppSegment + 1, -1);
    }
  }

  // Then validate the extracted entity IDs.
  let isValid = hasType(entID, "hex") && ancCatIDs.reduce(
    (acc, val) => acc && hasType(val, "hex"),
    true
  ) && ancAppIDs.reduce(
    (acc, val) => acc && hasType(val, "hex"),
    true
  );
  if (!isValid) {
    console.error(
      "Encountered a non-hexadecimal segment in the URL when expecting an " +
      "entity ID"
    );
    return missingPageJSX;
  }

  return <div className="app-browser">
    <EntityPage key="c" type={type} entID={entID}
      ancCatIDs={ancCatIDs} ancAppIDs={ancAppIDs}
    />
  </div>;
}
