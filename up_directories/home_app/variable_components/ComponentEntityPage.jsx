
import {slice, indexOf} from 'string';
import {encodeURIComponent} from 'query';
import {fetchEntityDefinition} from "/1/1/entities.js";


export function render({entKey, url, tailURL}) {
  let history = this.subscribeToContext("history");
  let userID = this.subscribeToContext("userID");
  let {componentDef, Component, useFullScreen} = this.state;

  // If this component's definition object is not already gotten, fetch it.
  if (componentDef === undefined) {
    fetchEntityDefinition(entKey, true).then(compDef => {
      this.setState(state => ({...state, componentDef: compDef ?? false}));
    });
    return <div className="fetching"></div>;
  }

  else if (!componentDef) {
    return <div className="missing"></div>;
  }

  // And if the component has not yet been obtained, do so.
  else if (Component === undefined) {
    let componentPath = componentDef["Example component path"] ||
      componentDef["Component path"];

    import(componentPath).then(Component => {
      this.setState(state => ({...state, Component: Component ?? false}));
    });

    // Also immediately handle the "Use full screen" property.
    let useFullScreenProp = componentDef["Use full screen"] ? true : false;
    if (useFullScreen === undefined && useFullScreenProp) {
      this.setState(state => ({...state, useFullScreen: useFullScreenProp}));
    }

    let className = "fetching" + (useFullScreen ? " full-screen" : "");
    return <div className={className}></div>;
  }

  else if (Component === undefined) {
    return <div className="fetching"></div>;
  }

  else if (!Component) {
    return <div className="missing"></div>;
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
    let indOfSecondSlash = indexOf(tailURL, "/", 1);
    if (indOfSecondSlash === -1) indOfSecondSlash = undefined;
    let firstTailSegment = slice(tailURL, 1, indOfSecondSlash);
    let newURLTail = slice(tailURL, firstTailSegment.length + 1);
    let uriSafeComponentName = encodeURIComponent(componentName);
    if (firstTailSegment !== uriSafeComponentName) {
      history.replaceState(
        null,
        slice(url, 0, -tailURL.length || undefined) +
          "/" + uriSafeComponentName + newURLTail
      );
      return <div className="fetching"></div>;
    }
    let newHomeURL = slice(url, 0, -newURLTail.length || undefined);

    // Create the set of props to pass to component entity component.
    let defaultProps = {
      url: url, homeURL: newHomeURL, tailURL: newURLTail,
      history: history, userID: userID,
    };
    let props = exampleProps || (
      getExampleProps ? getExampleProps(defaultProps) : defaultProps
    );

    // Then return the component page.
    let className = "component-page" + (useFullScreen ? " full-screen" : "");
    return <div className={className}>
      {/* TODO: Also fetch some 'Is Trusted' score for the component entity,
        * and only show the warning if the component is not sufficiently
        * trusted (looking at both the score itself and its weight, of course).
      */}
      <div className="warning">{
        "Insert phishing warning here, and button (and checkbox) to dismiss."
      }</div>
      <div className="component">
        <Component {...props} key="_0" />
      </div>
    </div>;
  }
}
