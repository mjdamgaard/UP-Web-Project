
import {random, round} from 'math';



export function render({rowInd, colInd}) {
  let className = "game-square" + (this.state.isColored ? " colored" : "");

  // Render a div element with or without the "colored" class, and with an
  // onClick callback that triggers the "new-move" event for the parent
  // instance (or another ancestor instance) to handle.
  return <div className={className} onClick={() => {
    this.trigger("new-move", [rowInd, colInd]);
  }}></div>;
}



// initialize(props) defines the initial state of the component instance.
// It is called only once in the lifetime of the instance, namely before the
// first call to render(). This initial state, as well as any subsequent state,
// can then be accessed by 'this.state' inside the render() function.
export function initialize() {
  return {isColored: round(random())};
}



// The 'actions' of a component is basically its "private methods." They can be
// called via 'this.do(<action key>)', either from the render() function, or
// from another action. (Remember to use always the 'function' keyword for
// actions, rather than arrow functions, such that 'this' can be bound to the
// desired JSXInstance object.)
export const actions = {
  "flip": function() {
    this.setState(({isColored}) => ({isColored: !isColored}));
  },
  "getValue": function() {
    return this.state.isColored;
  },
};

// The 'methods' export of a component declares all the actions that should be
// elevated as "public methods" of the component, which can then be called by
// the parent instance. The methods are called by the parent instance via
// 'this.call(<method key>, [input])'.
export const methods = [
  "flip",
  "getValue",
]; 