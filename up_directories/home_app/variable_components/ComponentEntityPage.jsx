
import {slice, indexOf} from 'string';
import {encodeURIComponent} from 'query';
import {fetchEntityDefinition} from "/1/1/entities.js";


export function render({entKey, url, tailURL}) {
  let history = this.subscribeToContext("history");
  let userID = this.subscribeToContext("userID");
  let {componentDef, Component, props, isFetching, useFullScreen} = this.state;

  // If this component's definition object is not already gotten, fetch it.
  if (componentDef === undefined) {
    fetchEntityDefinition(entKey, true).then(compDef => {
      this.setState(state => ({...state, componentDef: compDef}));
    });
    return <div className="fetching"></div>;
  }

  // And if the component has not yet been obtained, together with its props,
  // do so.
  else if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));

    let componentPath = componentDef["Component path"];
    let exampleComponentPath = componentDef["Example component path"];
    let exampleProps = componentDef["Example props"];
    let getExampleProps = componentDef["getExampleProps"];
    let useFullScreen = componentDef["Use full screen"];

    if (useFullScreen) {
      this.setState(state => ({...state, useFullScreen: useFullScreen}));
    }

    // Create the new homeURL for the component page, which in the case
    // componentName is undefined is just the url minus the tailURL (i.e. the
    // URL remainder after the "/c/<entID>" part), plus a "/n". But if the
    // componentName is defined, we actually add a URI-safe version of that
    // name as part of the new homeUrl, namely by using replaceState() if the
    // current url does not match this name.
    let componentName = componentDef["Name"] || "n"; // "n" is a placeholder
    // for the name of the component, or an abbreviation for "no name," if you
    // will.
    let newHomeURL;
    let indOfSecondSlash = indexOf(tailURL, "/", 1);
    if (indOfSecondSlash === -1) indOfSecondSlash = undefined;
    let firstTailSegment = slice(tailURL, 1, indOfSecondSlash);
    let newURLTail = slice(tailURL, firstTailSegment.length + 1);
    let uriSafeComponentName = encodeURIComponent(componentName);
    // TODO: The following if-else statement does not work since the !isFetching
    // branch is only traversed once. So fix this impl. somehow.
    if (firstTailSegment !== uriSafeComponentName) {
      history.replaceState(
        null,
        slice(url, 0, -tailURL.length || undefined) +
          "/" + uriSafeComponentName + newURLTail
      );
      return <div className="fetching"></div>;
    }
    else {
      newHomeURL = slice(url, 0, -newURLTail.length || undefined);
    }

    // Create the default set of props to pass to component entity components
    // if the "Example props" property.
    // TODO: Add the right default props here, such as pushState() and/or
    // homeURL, etc.
    let defaultProps = {
      url: url, homeURL: newHomeURL, tailURL: newURLTail,
      history: history, userID: userID,
    };

    // If there are no example props, use exampleComponentPath ?? componentPath
    // to fetch the component, and then give it the defaultProps as its props.
    if (!exampleProps && !getExampleProps) {
      import(exampleComponentPath ?? componentPath).then(Component => {
        this.setState(state => ({
          ...state, Component: Component ?? false, props: defaultProps
        }));
      });
    }

    // Else if there are, use componentPath itself to fetch the component, and
    // let its props be given by exampleProps, or getExampleProps(defaultProps).
    else {
      let props = exampleProps || getExampleProps(defaultProps);
      this.setState(state => ({...state, props: props}));
      import(componentPath).then(Component => {
        this.setState(state => ({
          ...state, Component: Component ?? false, props: props
        }));
      });
    }

    return <div className="fetching"></div>;
  }

  else if (Component === undefined) {
    return <div className="fetching"></div>;
  }

  else if (!Component) {
    return <div className="missing"></div>;
  }

  // Finally, if the component is ready, render it, passing it the same props
  // is this component.
  else {
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
