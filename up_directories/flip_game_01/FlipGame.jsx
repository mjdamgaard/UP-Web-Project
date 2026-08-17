
import {createArray} from 'array';
import {random, min, max} from 'math';
import {parseInt, isNaN} from 'number';
import * as ILink from 'ILink';

const minSize = 2;
const maxSize = 10;


export function render() {
  let {size = 3, moveCount, gameState, winningMoveCount} = this.state;
  if (!gameState) {
    this.do("startNewGame");
    return <div></div>;
  }

  let sizeSegment = min(
    max(parseInt(this.getSegment(0)) || 3, minSize), maxSize
  );
  if (!isNaN(sizeSegment) && size !== sizeSegment) {
    this.setState(state => ({...state, size: sizeSegment}));
    this.do("startNewGame");
  }

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
  if (this.isFirstRender) this.doAfterRender("startNewGame");

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
        <button onClick={() => this.do("restart")}>Restart</button>
        <button onClick={() => this.do("startNewGame")}>New game</button>
        <button onClick={() => this.do("undo")}>Undo</button>
        <button onClick={() => this.do("redo")}>Redo</button>
      </div>
      <div className="mode-menu">
        <h5>Other game modes</h5>
        <div><ILink key="l-3" href="~/3">3-by-3</ILink></div>
        <div><ILink key="l-4" href="~/4">4-by-4</ILink></div>
        <div><ILink key="l-5" href="~/5">5-by-5</ILink></div>
        <div><ILink key="l-6" href="~/6">6-by-6</ILink></div>
      </div>
    </div>
  </div>;
}



export const actions = {
  "newMove": function([rowInd, colInd]) {
    let {size = 3, gameState, moveCount, moves, winningMoveCount} = this.state;
    if (moves.length > moveCount) moves.length = moveCount;
    moveCount++;
    flipSquareAndNeighbors(gameState, rowInd, colInd, size);
    winningMoveCount ||= getIsComplete(gameState, size) ? moveCount : false;
    moves.push(
      {rowInd: rowInd, colInd: colInd, winningMoveCount: winningMoveCount});
    this.setState(state => ({
      ...state, moveCount: moveCount, winningMoveCount: winningMoveCount
    }));
    this.rerender();
  },
  "startNewGame": function() {
    let {size = 3} = this.state;
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
    if (getIsComplete(newGameState, size)) {
      return this.do("startNewGame");
    }
    this.setState(state => ({
      ...state, moveCount: 0, winningMoveCount: false, gameState: newGameState,
      initGameState: copy(newGameState), moves: new MutableArray(),
    }));
    this.rerender();
  },
  "undo": function() {
    let {size = 3, gameState, moveCount, moves} = this.state;
    if (moveCount <= 0) return;
    let prevMove = moves[moveCount - 1];
    let {rowInd, colInd} = prevMove;
    let winningMoveCount = moveCount <= 1 ? false :
      moves[moveCount - 2].winningMoveCount;
    flipSquareAndNeighbors(gameState, rowInd, colInd, size);
    this.setState(state => ({
      ...state, moveCount: moveCount - 1, winningMoveCount: winningMoveCount
    }));
    this.rerender();
  },
  "redo": function() {
    let {size = 3, gameState, moveCount, moves} = this.state;
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
  "handleKeyPress": function(e) {
    if (e.key === "u") {
      this.do("undo");
    }
    else if (e.key === "r") {
      this.do("redo");
    }

  },
};



function copy(gameState) {
  return gameState.map(row => [...row]);
}


function flipSquareAndNeighbors(gameState, rowInd, colInd, size) {
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
  }
}

function getIsComplete(gameState, size) {
  let ret = true;
  for (let rowInd = 0; rowInd < size && ret; rowInd++) {
    for (let colInd = 0; colInd < size && ret; colInd++) {
      ret = !gameState[rowInd][colInd];
    }
  }
  return ret;
}