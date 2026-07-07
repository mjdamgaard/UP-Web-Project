
import {clearPermissions} from 'query';
import {urlActions, urlEvents} from "./urlActions.js";

import {substring, indexOf} from 'string';
import {hasType} from 'type';
import {getFirstSegmentAndTail} from 'path';
import {parse} from 'json';

import * as AppLoader from "./AppLoader.js";
import * as placeholdersJSON from "./placeholders.json";
import * as mainStyle from "./style.css";

const {this: {"file_browser": fileBrowserID, "app_browser": appBrowserID}} =
  parse(placeholdersJSON);

export const missingPage = "404 error: Missing page."; // TODO: Improve.



export function initialize() {
  return {
    ref: {appLoaderProps: undefined},
  };
}



export function render(props) {
  let {
    url, homeURL = "", nodeID, userID, history, localStorage, sessionStorage,
    settings,
  } = props;
  let {ref: {appLoaderProps}} = this.state;

  let tailURL = substring(url, homeURL.length);

  // Get the first segment of the tailURL, and according this segment.
  let [firstSegment, newTailURL] = getFirstSegmentAndTail(tailURL ?? "");
  let newHomeURL = homeURL + "/" + firstSegment;

  let hideAppLoader = true;
  let useOriginal, useDefault;
  switch (firstSegment) {
    // If the tailURL starts with "a", redirect to the AppLoader. (We also
    // use hideAppLoader and appLoaderProps is part of a scheme to not lose its
    // state once the AppLoader is rendered the first time.
    case "ao":
      useOriginal = true;
    case "ad":
      useDefault = useOriginal ? false : true;
    case "a": 
      appLoaderProps = {
        ...props, homeURL: newHomeURL, tailURL: newTailURL,
        useOriginal: useOriginal, useDefault: useDefault,
      };
      hideAppLoader = false;
      this.setState(state => ({
        ...state,
        ref: {...state.ref, appLoaderProps: appLoaderProps},
      }));
      // (Since we only alter state.ref here, this will not cause a rerender.)
      break;
    
    // The fallowing cases are some placeholder segments that each redirects to
    // a URL of the "/a/..." type.
    case "":
    case "apps":
      this.do("replaceURL", "~/a/" + appBrowserID + "/apps" + newTailURL);
      hideAppLoader = true;
      break;
    case "files":
      this.do("replaceURL", "~/a/" + fileBrowserID + "/files" + newTailURL);
      hideAppLoader = true;
      break;
    // TODO: Add other shortcuts, in particular for tutorials and the entity
    // browser.

    default:
      content = missingPageContent;
  }

  return (
    <div className="root-app" innerStyle={mainStyle}>
      <div className={"app-loader" + (hideAppLoader ? " hidden" : "")}>
        {(appLoaderProps ?
          <AppLoader {...appLoaderProps} key="l" /> :
          undefined
        )}
      </div>
    </div>
  );
}



export const events = [
  ...urlEvents,
  "pushState",
  "replaceState",
  "back",
  "forward",
  "go",
];


export const actions = {
  // The urlActions and urlEvents objects importantly define a "pushURL" and
  // a "replaceURL" action/event, which can be used let push/replaceState()
  // without the state argument, and which importantly also include some syntax
  // regarding what we call "home URLs," which are essentially used to group
  // the URL segments, and then use relative URLs stating with "~/" or "~~/"
  // (which are similar to "./" and "../") to go to the start of the current
  // group, or go to the start of the parent group, etc. (In order to make this
  // work, it needs a bit of careful setup, however, as you also e.g. need to
  // set the homeURL prop correctly on the components at the root of a group.)
  ...urlActions,

  "pushState": function([state, url]) {
    clearPermissions(() => this.props.history.pushState(state, url));
    return true;
  },
  "replaceState": function([state, url]) {
    clearPermissions(() => this.props.history.replaceState(state, url));
    return true;
  },
  "back": function() {
    clearPermissions(() => this.props.history.back());
    return true;
  },
  "forward": function() {
    clearPermissions(() => this.props.history.forward());
    return true;
  },
  "go": function(delta) {
    clearPermissions(() => this.props.history.go(delta));
    return true;
  },
};
