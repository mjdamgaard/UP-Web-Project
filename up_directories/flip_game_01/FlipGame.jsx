
import {createArray} from 'array';
import {random} from 'math';
import * as GameSquare from "./GameSquare.jsx";


export function initialize() {
  return {
    rowNum: 3, colNum: 3, moveCount: 0, gameState: [
      new MutableArray([false, false, false]),
      new MutableArray([false, false, false]),
      new MutableArray([false, false, false]),
    ],
  };
}

export function render() {
  let {rowNum, colNum, moveCount} = this.state;

  // Create the rowNum-by-colNum matrix of game squares.
  let gameSquares = gameState.map((row, rowInd) => (
    <div className="game-row">{(
      row.map((val, colInd) => (
        <div className={"game-square" + (val ? " colored" : "")}
          onClick={() => this.do("newMove", [rowInd, colInd])}
        ></div>
      ))
    )}</div>
  ));

  // If this is the first render, initiate a new game.
  if (this.isFirstRender) this.doAfterRender("startNewGame");

  // Return the JSX element of the game app.
  return <div className="flip-game">
    <h4>Remove all the black squares!</h4>
    <div className="game">
      {(gameSquares)}
    </div>
    <div className="move-count">
      Moves: {moveCount}
    </div>
  </div>;
}



export const actions = {
  "newMove": function([rowInd, colInd]) {
    let {rowNum, colNum, gameState} = this.state;
    flipSquareAndNeighbors(gameState, rowInd, colInd, rowNum, colNum);
    this.setState(state => ({...state, moveCount: state.moveCount + 1}));
  },
  "startNewGame": function() {
    let {rowNum, colNum} = this.state;
    let newGameState = createArray(rowNum, () => (
      new MutableArray(createArray(colNum, () => false))
    ));
    for (let rowInd = 0; rowInd < rowNum; rowInd++) {
      for (let colInd = 0; colInd < colNum; colInd++) {
        if (random() > 0.5) {
          flipSquareAndNeighbors(newGameState, rowInd, colInd, rowNum, colNum);
        }
      }
    }
    this.setState(state => ({...state, moveCount: 0, gameState: newGameState}));
  }
};



function flipSquareAndNeighbors(gameState, rowInd, colInd, rowNum, colNum) {
    gameState[rowInd][colInd] = !gameState[rowInd][colInd];
    if (rowInd > 0) {
      gameState[rowInd - 1][colInd] = !gameState[rowInd - 1][colInd];
    }
    if (rowInd < rowNum - 1) {
      gameState[rowInd + 1][colInd] = !gameState[rowInd + 1][colInd];
    }
    if (colInd > 0) {
      gameState[rowInd][colInd - 1] = !gameState[rowInd][colInd - 1];
    }
    if (colInd < colNum - 1) {
      gameState[rowInd][colInd + 1] = !gameState[rowInd][colInd + 1];
    }
}