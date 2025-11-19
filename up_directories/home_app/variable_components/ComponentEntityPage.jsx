
import {fetchEntityDefinition} from "/1/1/entities.js";


export function render({entKey, url, pageURL}) {
  let {componentDef, Component, props, isFetching} = this.state;

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

    // Create the default set of props to pass to component entity components
    // if the "Example props" property.
    // TODO: Add the right default props here, such as pushState() and/or
    // pageURL, etc.
    let defaultProps = {};

    // If there are no example props, use exampleComponentPath ?? componentPath
    // to fetch the component, and then give 
    if (!exampleProps && !getExampleProps) {
      this.setState(state => ({...state, props: defaultProps}));
      import(exampleComponentPath ?? componentPath).then(Component => {
        this.setState(state => ({...state, Component: Component ?? false}));
      });
    }

    // Else if there are, use componentPath itself to fetch the component, and
    // let its props be given by exampleProps, or getExampleProps(defaultProps).
    else {
      let props = exampleProps || getExampleProps(defaultProps);
      this.setState(state => ({...state, props: props}));
      import(componentPath).then(Component => {
        this.setState(state => ({...state, Component: Component ?? false}));
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
    return <div>
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
