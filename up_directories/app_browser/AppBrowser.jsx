
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



// Old:

  // If the second segment is either "app" or "cat", parse the list of
  // ancestor class IDs, if any, and the ancestor app IDs, if any, as well
  // as the final entity ID (entID), also recording the type, i.e. "cat" or
  // "app". That is, unless the URL end in "/path<entPath>", in which case
  // query for the corresponding entID and redirect to a URL where this part
  // is replaced with that ID.
  if (segment2 === "app" || segment2 === "cat") {
    // First handle any trailing "/path<entPath>" segment group.
    let indOfPathSegment = indexOf(restSegments, "path");
    if (indOfPathSegment !== -1) {
      let {entIDIsMissing} = this.state;
      if (entIDIsMissing) {
        return missingPageJSX;
      }
      let entPathSegments = sliceArray(restSegments, indOfPathSegment + 1);
      let initSegments = sliceArray(restSegments, 0, indOfPathSegment);
      let entPath = "/" + join(entPathSegments, "/");
      let intiURL = "~/apps/" + segment2 + "/" + join(initSegments, "/");
      fetchEntityID(entPath).then(entID => {
        this.trigger("replaceURL", intiURL + "/" + entID);
      }).catch(err => {
        this.setState(state => ({...state, entIDIsMissing: true}));
      });
      return fetchingPageJSX;
    }

    // Then divide restSegments into the segments following the "/cat" segment
    // and the ones following the "/app" segment.
    let catSegments, appSegments, type;
    let indOfAppSegment = indexOf(restSegments, "app");
    if (indOfAppSegment === -1) {
      if (restSegments[0] !== "cat") {
        return missingPageJSX;
      }
      type = "cat";
      catSegments = sliceArray(restSegments, 1);
      appSegments = [];
    }
    else if (indOfAppSegment === 0) {
      type = "app";
      catSegments = [];
      appSegments = sliceArray(restSegments, 1);
    }
    else {
      if (restSegments[0] !== "cat") {
        return missingPageJSX;
      }
      type = "app";
      catSegments = sliceArray(restSegments, 1, indOfAppSegment);
      appSegments = sliceArray(restSegments, indOfAppSegment + 1);
    }

    // Then verify that all the catSegments and appSegments are hexadecimal
    // strings, and extract and subtract the final entID from the relevant
    // array, such that the remaining catSegments and appSegments arrays now
    // contains only all the ancestor categories/classes and ancestor apps.
    let callback = (acc, val) => acc || (hasType(val, "hex") ? false : val);
    let inValidIDSegment =
      reduce(catSegments, callback, false) ||
      reduce(appSegments, callback, false);
    if (inValidIDSegment) {
      console.error(
        'URL contained segment "' + inValidIDSegment +'" that was expected ' +
        "to be a hexadecimal string"
      );
      return missingPageJSX;
    }
    let entID, ancestorCatIDs = catSegments, ancestorAppIDs = appSegments;
    if (!entPath) {
      if (type === "app") {
        entID = at(appSegments, -1);
        ancestorAppIDs = sliceArray(appSegments, 0, -1);
      }
      else {
        entID = at(catSegments, -1);
        ancestorCatIDs = sliceArray(catSegments, 0, -1);
      }
    }

    // And finally, render either an AppPage or an AppCategoryPage depending on
    // the type, passing the relevant data parsed from the URL.
    if (type === "app") {
      return <AppPage key="a" entID={entID}
        ancestorCatIDs={ancestorCatIDs} ancestorAppIDs={ancestorAppIDs}
      />;
    }
    else {
      return <AppCategoryPage key="c" entID={entID}
        ancestorCatIDs={ancestorCatIDs} ancestorAppIDs={ancestorAppIDs}
      />;
    }
  }
