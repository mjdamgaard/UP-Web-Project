
import * as AppLoader from "./src/AppLoader.jsx";
import * as WarningWrapper from "./src/WarningWrapper.jsx";
import * as MissingPage from "./src/MissingPage.jsx";
import * as AppFrame from "./src/AppFrame.jsx";
import * as AboutPage from "./src/AboutPage.jsx";

import placeholders from "./placeholders.js";

const {
  this: {directories: {
    "base_app": baseAppDirID,
    "app_browser": appBrowserDirID,
    "file_browser": fileBrowserDirID,
  }},
} = placeholders;


// The main job(s) of a "base app" is to define a header menu for the website
// (which apps can choose to hide and use their own headers), and the outer
// frame of the website in general, and then to load the given app, pointed to
// by the URL within that frame. However, it also potentially loads an updated
// version of itself first, and then gives it a false loadUpdatedSelf prop to
// let it know not to load any other versions of itself, but to continue as it
// is.
// This base app uses an AppLoader component both to load both an updated
// version of itself and to load the app itself. This AppLoader component
// implements a special system that allows users to share URLs with each other,
// where the semantics of the shares web pages are preserved, but where the
// exact app that is used to render them might differ for each user that loads
// the page. See ./src/AppLoader.jsx for more information.



export function initialize() {
  return {ref: {appLoaderProps: undefined}};
}


export function render({
  fetchBestVersionRouteTemplate, loadUpdatedSelf = false
}) {
  let userID = this.getContext("userID");

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
    return <AppLoader key="0" userID={userID} useOriginal={0} useDefault={0}
      fetchBestVersionRouteTemplate={fetchBestVersionRouteTemplate}
      Wrapper={WarningWrapper} appProps={{
        fetchBestVersionRouteTemplate: fetchBestVersionRouteTemplate,
        loadUpdatedSelf: false,
      }}
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
      useOriginal = 1;
    case "d":
      useDefault = useOriginal ? 0 : 1;
    case "a": {
      appLoaderProps = {
        userID: userID, useOriginal: useOriginal, useDefault: useDefault,
        fetchBestVersionRouteTemplate: fetchBestVersionRouteTemplate,
        Wrapper: WarningWrapper, appProps: {
          fetchBestVersionRouteTemplate: fetchBestVersionRouteTemplate,
          loadUpdatedSelf: false,
        }
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
    <div className="base-app">
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

