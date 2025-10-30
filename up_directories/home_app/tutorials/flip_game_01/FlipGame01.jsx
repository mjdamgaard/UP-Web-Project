
import {createArray} from 'array';

import * as GameSquare from "./GameSquare.jsx";



// The render() function takes a props object and returns a JSX element, just
// like the component functions in React.

export function render({rowNum = 3, colNum = 3}) {
  // Create a random rowNum-by-colNum matrix of GameSquare instances, which
  // each chooses its own initial state at random.
  let gameSquares = createArray(rowNum, rowInd => (
    <div className="row">{
      createArray(colNum, colInd => (
        <GameSquare key={"s-" + rowInd + "-" + colInd}
          rowInd={rowInd} colInd={colInd}
        />
      ))
    }</div>
  ));

  // Return the JSX element of the game app.
  return <div className="game">
    {gameSquares}
  </div>;
}




// The 'actions' of a component is basically its "private methods." They can be
// called via 'this.do(<action key>)', either from the render() function, or
// from another action. (Remember to use always the 'function' keyword for
// actions, rather than arrow functions, such that 'this' can be bound to the
// desired JSXInstance object.)
export const actions = {
  // The "new-move" event is triggered when a square is selected by the user.
  "new-move": function([rowInd, colInd]) {
    let {rowNum = 3, colNum = 3} = this.props;

    // Call the flip() method of the square at (rowInd, colInd), as well as all
    // its neighbors.
    this.call("s-" + rowInd + "-" + colInd, "flip");
    if (rowInd > 0) {
      this.call("s-" + (rowInd - 1) + "-" + colInd, "flip");
    }
    if (colInd > 0) {
      this.call("s-" + rowInd + "-" + (colInd - 1), "flip");
    }
    if (rowInd < rowNum - 1) {
      this.call("s-" + (rowInd + 1) + "-" + colInd, "flip");
    }
    if (colInd < colNum - 1) {
      this.call("s-" + rowInd + "-" + (colInd + 1), "flip");
    }
  },
};


// The 'events' export of a component declares all the actions that should be
// elevated as "events" of the component, which can then be triggered by
// any of its descendant instances. An event is triggered by a descendant
// instance via 'this.trigger(<event key>, [input])'.
export const events = [
  "new-move",
]; 


export const styleSheets = [
  abs("./FlipGame01.css"),
];
