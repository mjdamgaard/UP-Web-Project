
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
// prop to let it know not to load any other versions of itself, but to
// continue as it is.
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
  let {loadUpdatedSelf = true} = props;

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
    return <AppLoaderWrapper key="0" {...props} loadUpdatedSelf={false} />;
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
        ...props, useOriginal: useOriginal, useDefault: useDefault,
      };
      this.setState(state => ({
        ...state, ref: {...state.ref, appLoaderProps: appLoaderProps},
      }));
      // (Since we only alter state.ref here, this will not cause a rerender.)
      break;
    }

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

