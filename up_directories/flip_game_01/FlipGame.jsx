
import {createArray} from 'array';
import {random, min, max} from 'math';
import {parseInt, isNaN} from 'number';

const minSize = 2;
const maxSize = 10;


export function initialize() {
  let gameState = [
    new MutableArray([false, false, false]),
    new MutableArray([false, false, false]),
    new MutableArray([false, false, false]),
  ];
  return {
    size: 3, moveCount: 0, gameState: gameState, winningMoveCount: false,
    initGameState: copy(gameState), moves: new MutableArray(),
  };
}

export function render() {
  let {size, moveCount, gameState, winningMoveCount} = this.state;
  // let sizeSegment = min(
  //   max(parseInt(this.getSegment(0)) || 3, minSize), maxSize
  // );
  // if (!isNaN(sizeSegment) && size !== sizeSegment) {
  //   this.setState(state => ({...state, size: sizeSegment}));
  //   this.do("startNewGame");
  // }

  // Create the matrix of game squares.
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
  // if (this.isFirstRender) this.doAfterRender("startNewGame");

  // Return the JSX element of the game app.
  return <div className="flip-game"
    onKeyDown={e => this.do("handleKeyPress", e)}
  >
    <h4>Remove all the black squares!</h4>
    <div className="game">
      {(gameSquares)}
    </div>
    <div className="menu">
      <div className="info">
        {winningMoveCount ? "Completed! " : undefined}
        Size: {size}-by-{size}, Moves: {winningMoveCount || moveCount}
      </div>
      <div className="buttons">
        <button onClick={() => this.do("undo")}>Undo</button>
        <button onClick={() => this.do("redo")}>Redo</button>
        <button onClick={() => this.do("restart")}>Restart</button>
        <button onClick={() => this.do("startNewGame")}>New game</button>
      </div>
      <div className="mode-menu">
        {/* TODO: Impl. */}
      </div>
    </div>
  </div>;
}



export const actions = {
  "newMove": function([rowInd, colInd]) {console.log("newMove")
    let {size, gameState, moveCount, moves, winningMoveCount} = this.state;
    if (moves.length > moveCount) moves.length = moveCount;
    if (!winningMoveCount) moveCount++;
    flipSquareAndNeighbors(gameState, rowInd, colInd, size);
    winCount ||= getIsComplete(gameState, size) ? moveCount : false;
    moves.push({rowInd: rowInd, colInd: colInd, winningMoveCount: winCount});
    this.setState(state => ({
      ...state, moveCount: moveCount, winningMoveCount: winCount
    }));
    this.rerender();
  },
  "startNewGame": function() {
    let {size} = this.state;
    let newGameState = createArray(size, () => (
      new MutableArray(createArray(size, () => false))
    ));
    for (let rowInd = 0; rowInd < size; rowInd++) {
      for (let colInd = 0; colInd < size; colInd++) {
        if (random() > 0.5) {
          flipSquareAndNeighbors(newGameState, rowInd, colInd, size);
        }
      }
    }
    if (getIsComplete(newGameState)) {throw "debug"
      return this.do("startNewGame");
    }
    this.setState(state => ({
      ...state, moveCount: 0, gameState: newGameState, winningMoveCount: false,
      moves: new MutableArray(),
    }));
    this.rerender();
  },
  "undo": function() {
    let {size, gameState, moveCount, moves} = this.state;
    if (moveCount <= 0) return;
    let prevMove = moves[moveCount - 1];
    let {rowInd, colInd, winningMoveCount} = prevMove;
    flipSquareAndNeighbors(gameState, rowInd, colInd, size);
    this.setState(state => ({
      ...state, moveCount: moveCount - 1, winningMoveCount: winningMoveCount
    }));
    this.rerender();
  },
  "redo": function() {
    let {size, gameState, moveCount, moves} = this.state;
    if (moveCount >= moves.length) return;
    let nextMove = moves[moveCount];
    let {rowInd, colInd, winningMoveCount} = nextMove;
    flipSquareAndNeighbors(gameState, rowInd, colInd, size);
    this.setState(state => ({
      ...state, moveCount: moveCount + 1, winningMoveCount: winningMoveCount
    }));
  },
  "restart": function() {
    let {initGameState} = this.state;
    let gameState = initGameState.map(row => new MutableArray(row));
    this.setState(state => ({
      ...state, moveCount: 0, gameState: gameState, winningMoveCount: false,
      moves: new MutableArray(),
    }));
    this.rerender();
  },
  "handleKeyPress": function(e) {console.log("key: ", e.key);
    if (e.key === "U") {
      this.do("undo");
    }
    else if (e.key === "U") {
      this.do("redo");
    }

  },
};



function copy(gameState) {
  return gameState.map(row => [...row]);
}


function flipSquareAndNeighbors(gameState, rowInd, colInd, size) {return;
  gameState[rowInd][colInd] = !gameState[rowInd][colInd];
  if (rowInd > 0) {
    gameState[rowInd - 1][colInd] = !gameState[rowInd - 1][colInd];
  }
  if (rowInd < size - 1) {
    gameState[rowInd + 1][colInd] = !gameState[rowInd + 1][colInd];
  }
  if (colInd > 0) {
    gameState[rowInd][colInd - 1] = !gameState[rowInd][colInd - 1];
  }
  if (colInd < size - 1) {
    gameState[rowInd][colInd + 1] = !gameState[rowInd][colInd + 1];
  }console.log("end")
}

function getIsComplete(gameState, size) {return;
  let ret = true;
  for (let rowInd = 0; rowInd < size && ret; rowInd++) {
    for (let colInd = 0; colInd < size && ret; colInd++) {console.log(rowInd, colInd)
      ret = !gameState[rowInd][colInd];
    }
  }console.log("ret: ", ret);
  return ret;
}