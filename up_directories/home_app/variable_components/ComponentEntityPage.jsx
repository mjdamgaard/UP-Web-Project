
import {slice, indexOf} from 'string';
import {encodeURIComponent} from 'query';
import {includes} from 'array';
import {fetchEntityDefinition} from "/1/1/entities.js";
import * as PhishingWarning from "./PhishingWarning.jsx";


export function render({entKey, url, tailURL, localStorage, sessionStorage}) {
  let history = this.subscribeToContext("history");
  let userID = this.subscribeToContext("userID");
  let {
    componentDef, Component, isFetching, hasBeenDismissed, hasBeenReplaced,
  } = this.state;

  // If this component's definition object is not already gotten, fetch it.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(entKey, true).then(componentDef => {
      // Fetch the component. 
      let componentPath = componentDef["Example component path"] ||
        componentDef["Component path"];
      import(componentPath).then(Component => {
        this.setState(state => ({
          ...state,
          componentDef: componentDef ?? false,
          Component: Component ?? false,
        }));
      });
    });
    return <div className="fetching">{"..."}</div>;
  }

  else if (Component === undefined) {
    return <div className="fetching">{"..."}</div>;
  }

  else if (!Component) {
    return <div className="missing">{"missing"}</div>;
  }

  // And finally, when all is fetched, compute the props to give to Component,
  // and render the component page. 
  else {
    let exampleProps = componentDef["Example props"];
    let getExampleProps = componentDef["getExampleProps"];
    let useFullScreen = componentDef["Use full screen"];

    // Create the new homeURL for the component page, which in the case
    // componentName is undefined is just the url minus the tailURL (i.e. the
    // URL remainder after the "/c/<entID>" part), plus a "/n". But if the
    // componentName is defined, we actually add a URI-safe version of that
    // name as part of the new homeUrl, namely by using replaceState() if the
    // current url does not match this name.
    let componentName = componentDef["Name"] || "n"; // "n" is a placeholder
    // for the name of the component, or an abbreviation for "no name," if you
    // will.
    let uriSafeComponentName = encodeURIComponent(componentName);
    let indOfSecondSlash = indexOf(tailURL, "/", 1);
    if (indOfSecondSlash === -1) indOfSecondSlash = undefined;
    let firstTailSegment = slice(tailURL, 1, indOfSecondSlash);
    let newTailURL = slice(tailURL, firstTailSegment.length + 1);
    let newHomeURL = slice(url, 0, -tailURL.length || undefined) +
      "/" + uriSafeComponentName;
    if (!hasBeenReplaced && firstTailSegment !== uriSafeComponentName) {
      this.setState(state => ({...state, hasBeenReplaced: true}));
      history.replaceState(null, newHomeURL + newTailURL);
      return <div className="fetching"></div>;
    }

    // Create the set of props to pass to component entity component.
    let defaultProps = {
      url: url, homeURL: newHomeURL, tailURL: newTailURL,
      history: history, userID: userID,
    };
    let props = exampleProps ? {...defaultProps, ...exampleProps} : (
      getExampleProps ? getExampleProps(defaultProps) : defaultProps
    );

    // Then return the component page.
    let className = "component-page" + (useFullScreen ? " full-screen" : "");
    return <div className={className}>
      {hasBeenDismissed ? undefined :
        <PhishingWarning key="w" entKey={entKey}
          sessionStorage={sessionStorage} localStorage={localStorage}
        />
      }
      <div className={"component" + (hasBeenDismissed ? "" : " blurred")}>
        <Component {...props} key="_0" />
      </div>
    </div>;
  }
}



export function getInitialState({
  entKey, localStorage = undefined, sessionStorage = undefined
}) {
  let hasBeenDismissed;
  if (sessionStorage) {
    let acceptedComponents = sessionStorage.getItem("acceptedComponents") ?? [];
    if (includes(acceptedComponents, entKey)) {
      hasBeenDismissed = true;
    }
  }
  if (localStorage && !hasBeenDismissed) {
    let acceptedComponents = localStorage.getItem("acceptedComponents") ?? [];
    if (includes(acceptedComponents, entKey)) {
      hasBeenDismissed = true;
    }
  }
  return {hasBeenDismissed: hasBeenDismissed};
}



export const events = [
  "dismissWarning",
];

export const actions = {
  "dismissWarning": function(doNotWarnAgain) {
    let {entKey, sessionStorage, localStorage} = this.props;
    if (sessionStorage) {
      let newAcceptedComponents = [
        ...(sessionStorage.getItem("acceptedComponents") ?? []), entKey
      ];
      sessionStorage.setItem("acceptedComponents", newAcceptedComponents);
    }
    if (doNotWarnAgain && localStorage) {
      let newAcceptedComponents = [
        ...(localStorage.getItem("acceptedComponents") ?? []), entKey
      ];
      localStorage.setItem("acceptedComponents", newAcceptedComponents);
    }
    this.setState(state => ({...state, hasBeenDismissed: true}));
  },
};