
import {fetchEntityDefinition} from "/1/1/entities.js";


export function render(entKey, url, pageURL) {
  let {componentDef, Component} = this.state;

  // If this component's definition object is not already gotten, fetch it.
  if (componentDef === undefined) {
    fetchEntityDefinition(entKey, true).then(compDef => {
      this.setState(state => ({...state, componentDef: compDef}));
    });
    return <div className="fetching"></div>;
  }

  // And if the component, held in the "Component path" attribute, is not
  // already imported, do so.
  else if (Component === undefined) {
    let componentPath = componentDef["Component path"];
    // TODO: This should be this.import() instead...?
    import(componentPath).then(Component => {
      this.setState(state => ({...state, Component: Component}));
    });
    return <div className="fetching"></div>;
  }

  // Finally, if the component is ready, render it, passing it the same props
  // is this component.
  else {
    return <Component {...props} key="_0" />;
  }
}
