
import {fetchEntityDefinition} from "/1/1/entities.js";


export function render(props) {
  let {compEntID} = props;
  let {componentDef, Component} = this.state;

  // If this component's definition object is not already gotten, fetch it.
  // contain it.
  if (componentDef === undefined) {
    fetchEntityDefinition(compEntID).then(compDef => {
      this.setState(state => ({...state, componentDef: compDef}));
    });
    return <div className="fetching"></div>;
  }

  // And if the component, held in the "Component path" attribute, is not
  // already imported, do so.
  else if (Component === undefined) {
    let componentPath = componentDef["Component path"];
    import(componentPath).then(Component => {
      this.setState(state => ({...state, Component: Component}));
    });
    return <div className="fetching"></div>;
  }

  // Finally, if the component is ready, render it, passing it the same props
  // is this component.
  else {
    return <Component key="0" {...props} />;
  }
}
