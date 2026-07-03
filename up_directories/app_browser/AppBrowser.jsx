
import {fetch} from 'query';
import {split, join, substring} from 'string';
import {hasType} from 'type';
import {fetchEntityID} from "../semantic_entities/entities.js";
import {urlActions, urlEvents} from "../root_app/urlActions.js";
import {missingPage} from "../root_app/main.jsx";
import * as AppClassPage from "./src/AppClassPage.jsx";
import * as AppPage from "./src/AppPage.jsx";

const missingPageJSX = <div className="app-browser">
  {(missingPage)}
</div>;
const fetchingPageJSX = <div className="app-browser">
  <div className="fetching"></div>
</div>;

// The entity path of the general 'Apps' class.
const appsClassEntPath = abs("~/../semantic_entities/em3.js;get/apps");
const defaultTailURL = "~/apps/c/path" + appsClassEntPath;


export function render({url, homeURL, tailURL}) {
  let [segment1, segment2, segment3, ...rest] = split(tailURL ?? "", "/");

  // If the tail URL is empty, or if the second segment is empty, redirect to
  // "~/apps/c/path" + appsClassEntPath.
  if (!segment1 || segment1 === "apps" && !segment2) {
    this.trigger("replaceURL", defaultTailURL);
    return fetchingPageJSX;
  }

  // We here use a convention of using a constant first segment that signals
  // what kind of app the URL points to. 
  if (segment1 !== "apps") {
    return missingPageJSX;
  }

  // If the second segment is either "a" or "c", we expect the remainder of the
  // URL to either be a hexadecimal entity ID, or "/path" followed by an entity
  // path (i.e. a route to an object defining a "semantic entity").
  if (segment2 !== "a" && segment2 !== "c") {
    return missingPageJSX;
  }
  if (segment3 === "path") {
    let {entityIsMissing} = this.state;
    if (entityIsMissing) {
      missingPageJSX
    }
    let entPath = "/" + join(rest, "/");
    fetch(entPath).then(entID => {
      this.trigger("replaceURL", "~/apps/" + segment2 + "/" + entID);
    }).catch(err => {
      this.setState(state => ({...state, entityIsMissing: true}));
    });
    return fetchingPageJSX;
  }
  if (hasType(segment3, "hex")) {
    return segment2 === "c" ?
      <AppClassPage key="c" entID={segment3} /> :
      <AppPage key="a" entID={segment3} />;
  }
  else {
    return missingPageJSX;
  }
}



export const actions = urlActions;

export const events = urlEvents;

