
import {fetchEntityDefinition} from "/1/1/entities.js";


export function render(props) {
  let {compEntID} = props;
  let {Component, isFetching} = this.state;

  // Fetch the component.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(compEntID, true).then(componentDef => {
      let componentPath = componentDef["Component path"];
      import(componentPath).then(Component => {
        this.setState(state => ({...state, Component: Component ?? false}));
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

  // Finally, if the component is ready, render it, passing it the same props
  // is this component.
  else {
    return <Component {...props} key="_0" />;
  }
}
