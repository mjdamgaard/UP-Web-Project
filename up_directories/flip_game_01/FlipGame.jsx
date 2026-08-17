
import {createArray} from 'array';
import {random} from 'math';


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
  let {rowNum, colNum, moveCount, gameState, hasWon} = this.state;

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
    <div className="menu">
      <div className="move-count">
        {hasWon ? "Completed! " : ""} Moves: {moveCount}
      </div>
      <div className="buttons">
        {/* <button onClick={() => this.do("undo")}>Undo</button>
        <button onClick={() => this.do("redo")}>Redo</button>
        <button onClick={() => this.do("restart")}>Restart</button> */}
        <button onClick={() => this.do("startNewGame")}>New game</button>
      </div>
      <div className="mode-menu">
        {/* TODO: Impl. */}
      </div>
    </div>
  </div>;
}



export const actions = {
  "newMove": function([rowInd, colInd]) {
    let {rowNum, colNum, gameState, moveCount, hasWon} = this.state;
    if (!hasWon) moveCount++;
    flipSquareAndNeighbors(gameState, rowInd, colInd, rowNum, colNum);
    hasWon ||= getIsComplete(gameState, rowNum, colNum);
    this.setState(state => ({...state, moveCount: moveCount, hasWon: hasWon}));
    this.rerender();
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
    this.setState(state => ({
      ...state, moveCount: 0, gameState: newGameState, hasWon: false,
    }));
    this.rerender();
  },
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

function getIsComplete(gameState, rowNum, colNum) {
  let ret = true;
  for (let rowInd = 0; rowInd < rowNum && ret; rowInd++) {
    for (let colInd = 0; colInd < colNum && ret; colInd++) {
      ret = !gameState[rowInd][colInd];
    }
  }
  return ret;
}