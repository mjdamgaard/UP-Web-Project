
import {clearPermissions} from 'query';
import {substring, indexOf} from 'string';
import {hasType} from 'type';

import {urlActions, urlEvents} from "./src/urlActions.js";

import * as AppLoader from "./src/AppLoader.jsx";
import * as WarningWrapper from "./src/WarningWrapper.jsx";
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

const fetchBestAppRouteTemplate =
  abs("./server/apps.sm.js./callSMF/fetchPreferredSubApp/?");
// Todo for future version: Implement a fundamental settings page where users
// can change this SMF route template for fetching the best sub-app (with ample
// warnings about doing so).


// The main job(s) of a "base app" is to define a header menu for the website
// (which apps can choose to hide and use their own headers), and the outer
// frame of the website in general, and then to load the given app, pointed to
// by the URL within that frame. However, it actually also potentially loads an
// updated version of itself first, and then gives it a false loadUpdatedSelf
// prop to let it know not to load any other versions of itself, but to
// continue as it is.
// This base app uses an AppLoader component which looks at the next segment
// in the URL, which is supposed to be the directory ID of an app's home
// directory (an "appDirID"). It then uses the api.js module in the same home
// directory to find the most general version of the given app that implements
// the tail URL that comes after the appDirID segment. It then queries about
// the best app version to load in the app version tree, starting from this
// "most general version," which is the first version implement tail URLs of
// the given type. This "best version" might then depend on user preferences if
// the user is logged in. And finally it loads that app, and changes the
// appDirID segment to match the loaded app.
// The point of this system is thus to allow users to share URLs with each
// other, even though they have different app preferences, where this base app
// will then automatically load the best app version for the given user that
// implements the given tail URL.



export function initialize() {
  return {ref: {appLoaderProps: undefined}};
}


export function render({loadUpdatedSelf = true}) {
  // If loadUpdatedSelf is true, redirect to the AppLoader.
  if (loadUpdatedSelf) {
    // If the tail URL is empty, replace the URL by prepending a segment with
    // the directory ID of the root base app, which is this very base app,
    // defined in in this directory.
    let firstSegment = this.getFirstSegment();
    if (!firstSegment) {
      this.replaceURL("~/" + baseAppDirID);
      return <div></div>;
    }

    // Redirect to the AppLoader, which reads the first segment of the tail
    // URL, which ought to an app's directory ID, and then finds the best
    // version of that app to load instead.
    return <AppLoader key="0"
      Wrapper={WarningWrapper} appProps={{loadUpdatedSelf: false}}
      fetchBestAppRouteTemplate={fetchBestAppRouteTemplate}
    />;
  }

  // Else if reaching here, it means that the AppLoader component above has
  // loaded this base app as the best version. The URL will also have been
  // advanced in the process to a new tail URL that does not include the
  // baseAppDirID segment. And we can thus continue to render this base app by
  // branching on the next segment after that.
  let firstSegment = this.getFirstSegment();
  this.advanceURL(1); // Advance by 1 URL segment for child components.
  let {ref: {appLoaderProps}} = this.state;
  let baseAppPage, useOriginal, useDefault;
  switch (firstSegment) {
    // If the tailURL starts with "a", redirect to the AppLoader. And if its
    // starts with "o" or "d", also set the useOriginal and useDefault props.
    // (We also use the appLoaderProps state ref in a scheme designed to keep
    // the AppLoader child component alive once it is rendered the first time.)
    case "o":
      useOriginal = true;
    case "d":
      useDefault = useOriginal ? false : true;
    case "a": {
      appLoaderProps = {
        useOriginal: useOriginal, useDefault: useDefault,
        Wrapper: WarningWrapper,
        fetchBestAppRouteTemplate: fetchBestAppRouteTemplate
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
      let tailURL = this.getPath();
      this.replaceURL("~/a/" + appBrowserDirID + tailURL);
      hideAppLoader = true;
      break;
    case "files":
      let tailURL = this.getPath();
      this.replaceURL("~/a/" + fileBrowserDirID + tailURL);
      hideAppLoader = true;
      break;
    // TODO: Add other shortcuts, in particular for tutorials and the entity
    // browser.

    // The following cases are URLs that are defined by the base app. When
    // going to these URLs, this base app will keep the currently loaded app,
    // if any, alive in the background, hidden, while showing the page.
    case "about":
      baseAppPage = <AboutPage key="about" {...props} />
      break;
    
    // There are also pages which the AppFrame component below just renders on
    // top of the existing page, regardless of what it is, without changing the
    // URL. These are pages such as the login page and settings page, etc.

    default:
      baseAppPage = <MissingPage key="m" />;
  }

  return (
    <div innerStyle={mainStyle}>
      <AppFrame key="0">
        <div className={"base-app-page" + (baseAppPage ? "" : " hidden")}>
          {(baseAppPage)}
        </div>
        <div className={"app-loader" + (baseAppPage ? " hidden" : "")}>
          {(appLoaderProps ?
            <AppLoader key="l" {...appLoaderProps} /> :
            undefined
          )}
        </div>
      </AppFrame>
    </div>
  );
}

