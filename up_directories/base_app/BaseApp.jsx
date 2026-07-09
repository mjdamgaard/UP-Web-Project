
import {clearPermissions} from 'query';
import {substring, indexOf} from 'string';
import {hasType} from 'type';

import {urlActions, urlEvents} from "./src/urlActions.js";

import * as AppLoaderWrapper from "./src/AppLoaderWrapper.jsx";
import * as MissingPage from "./src/MissingPage.jsx";
import * as AppFrame from "./src/AppFrame.jsx";
import * as AboutPage from "./src/AboutPage.jsx";

import * as placeholders from "./placeholders.json;parse";

const {
  this: {
    "base_app": baseAppDirID,
    "app_browser": appBrowserDirID,
    "file_browser": fileBrowserDirID,
  },
} = placeholders;

export const missingPage = "404 error: Missing page."; // TODO: Improve.


// The main job(s) of a "base app" is to define a header menu for the website
// (which apps can choose to hide and use their own headers), and the outer
// frame of the website in general, and then to load the given app, pointed to
// by the URL within that frame. However, it actually also potentially loads an
// updated version of itself first, and then gives it a false loadUpdatedSelf
// prop to let it know not to further try to load an updated version of
// *it*self, but to just continue as it is.
// The first segment of the URL is then the most general version of the base
// app that implements the tail URL, which is looked up in the api.js module.
// This "most general version" of an app is basically the earliest ancestor
// version of the current app in the version tree to implement the given tail
// URL.
// If the base app points to another app, rather than a page defined by the
// base app itself (such as an 'about' page, etc.), then the base app loads
// that app within itself. And here it ought to also use a similar system of
// setting the "most general version" of that app that implements *its* tail
// URL as an initial segment.
// This general system of letting the URLs point to the "most general version"
// is a bit complicated, but the purpose is to allow users to share URLs while
// using different settings for what their preferred app version are, in such a
// way that the the shared URLs always have the same semantics, but where two
// different users might see the same page rendered a bit differently depending
// on their settings.
// But all in all, the base app's responsibility is mainly to load the app that
// is (typically) pointed to by the URL, and then to also define the global
// header, and general frame around the loaded app.



export function initialize() {
  return {
    ref: {appLoaderProps: undefined},
  };
}


export function render(props) {
  let {urlProps, localStorage, sessionStorage, loadUpdatedSelf = true} = props;
  let {tailSegments: [firstSegment], getChildURLProps} = urlProps;

  // If the tail URL is empty, replace the URL by prepending a segment with the
  // directory ID of the root base app, which is this very base app, defined in
  // in this directory.
  if (!firstSegment) {
    this.do("replaceURL", "~/" + baseAppDirID);
    return <div></div>;
  }

  // Then if loadUpdatedSelf is true, redirect to the AppLoader, which reads
  // the first segment of the tailURL, which ought to an app's directory ID,
  // and then finds the best version of that app to load instead.
  if (loadUpdatedSelf) {
    return <AppLoaderWrapper {...props} key="0" loadUpdatedSelf={false} />;
  }

  // Else if reaching here, it means that the AppLoader component above has
  // loaded this base app as the bast version. The urlProps will also have been
  // updated in the process, having advanced to a new tail URL that does not
  // include the baseAppDirID segment. And we can thus continue to render this
  // base app by branching on the next segment after that, which is now
  // contained in firstSegment.
  let childURLProps = getChildURLProps(1); // Advance by 1 URL segment.
  let childProps = {...props, urlProps: childURLProps};
  let {ref: {appLoaderProps}} = this.state;
  let baseAppPage, useOriginal, useDefault;
  switch (firstSegment) {
    // If the tailURL starts with "a", redirect to the AppLoader. And if its
    // starts with "ao" or "ad", also set the useOriginal and useDefault props.
    // (We also use the appLoaderProps state ref in a scheme designed to keep
    // the AppLoader child component alive once it is rendered the first time.)
    case "ao":
      useOriginal = true;
    case "ad":
      useDefault = useOriginal ? false : true;
    case "a": {
      appLoaderProps = {
        ...childProps, useOriginal: useOriginal, useDefault: useDefault,
      };
      this.setState(state => ({
        ...state, ref: {...state.ref, appLoaderProps: appLoaderProps},
      }));
      // (Since we only alter state.ref here, this will not cause a rerender.)
      break;
    }
    
    // The fallowing cases are some shortcut segments that each redirects to
    // a URL of the "/a/..." type.
    case "":
    case "apps":
      this.do("replaceURL", "~/a/" + appBrowserDirID + "/apps" + newTailURL);
      hideAppLoader = true;
      break;
    case "files":
      this.do("replaceURL", "~/a/" + fileBrowserDirID + "/files" + newTailURL);
      hideAppLoader = true;
      break;
    // TODO: Add other shortcuts, in particular for tutorials and the entity
    // browser.

    // The following cases are URLs that are defined by the base app. When
    // going to these URLs, this base app will keep the currently loaded app,
    // if any, alive in the background, hidden, while showing the page.
    case "about":
      baseAppPage = <AboutPage {...childProps} key="about" />
      break;
    
    // There are also pages which the AppFrame component below just renders on
    // top of the existing page, regardless of what it is, without changing the
    // URL. These are pages such as the login page and settings page, etc.

    default:
      baseAppPage = missingPage;
  }

  return (
    <div innerStyle={mainStyle}>
      <AppFrame key="0">
        <div className={"base-app-page" + (baseAppPage ? "" : " hidden")}>
          {(baseAppPage)}
        </div>
        <div className={"app-loader" + (baseAppPage ? " hidden" : "")}>
          {(appLoaderProps ?
            <AppLoaderWrapper {...appLoaderProps} key="l" /> :
            undefined
          )}
        </div>
      </AppFrame>
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
