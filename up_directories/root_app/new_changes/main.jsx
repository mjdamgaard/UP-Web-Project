
import {clearPermissions} from 'query';
import {urlActions, urlEvents} from "./urlActions.js";

import {substring, indexOf} from 'string';
import {hasType} from 'type';

import * as AppLoader from "./AppLoader.jsx";
import {getFirstSegment} from "./AppLoader.jsx";

const {this: {"file_browser": fileBrowserID, "app_browser": appBrowserID}}

const missingPageContent = "404 error: Missing page."; // TODO: Improve.



export function initialize() {
  return {
    ref: {
      appLoaderProps: undefined,
    },
  };
}



export function render(props) {
  let {
    url, history, nodeID, userID, homeURL = "", localStorage, sessionStorage
  } = props;
  let {ref: {appLoaderProps}} = this.state;
  this.provideContext("userID", userID);
  this.provideContext("nodeID", nodeID);

  let tailURL = substring(url, homeURL.length);

  // Get the first segment of the tailURL, and according this segment.
  let firstSegment = "", newTailURL = "", newHomeURL = undefined;
  if (tailURL) {
    firstSegment = getFirstSegment(tailURL);
    newTailURL = substring(tailURL, 1 + firstSegment.length);
    newHomeURL = homeURL + "/" + firstSegment
  }
  let content, hideAppLoader = true;
  let useOriginal, noPreferences;
  switch (firstSegment) {
    // If the tailURL starts with "a", redirect to the AppLoader. (We also
    // use hideAppLoader and appLoaderProps is part of a scheme to not lose its
    // state once the AppLoader is rendered the first time.
    case "a-o":
      useOriginal = true;
    case "a-np":
      noPreferences = true;
    case "a": 
      appLoaderProps = {
        ...props, homeURL: newHomeURL, tailURL: newTailURL,
        useOriginal: useOriginal, noPreferences: noPreferences,
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
      newTailURL = "/start";
    case "apps":
      this.do("replaceURL", "~/a/" + appBrowserID + "/apps" + newTailURL);
      content = <div className="fetching"></div>;
      break;
    case "files":
      this.do("replaceURL", "~/a/" + fileBrowserID + "/files" + newTailURL);
      content = <div className="fetching"></div>;
      break;
    // TODO: Add other shortcuts, in particular for tutorials and the entity
    // browser.
    
    // The following cases are some constant built-in pages, such as the
    // about page and the account page.
    case "about":
      content = <AboutPage key="about" />;
      break;
    case "account":
      content = <AccountPage key="account" />;
      break;
    default:
      content = missingPageContent;
  }

  return (
    <div className="root-app">
      {/* The content div is for non-AppLoader pages with their own URLs */}
      <div className={"native-page" + (content ? "" : " hidden")}>
        {(content)}
      </div>
      {/* The AppLoader, which we keep rendering once it has the first time,
      as to not its state, but where we hide it if a native page is open.
      */}
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



export const styleSheets = [
  abs("./style.css"),
];
