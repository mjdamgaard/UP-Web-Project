import {createContext, useContext, useState, useMemo} from "react";

export const ColumnContext = createContext();

export const ColumnListContext = createContext();

var _nonce = 0;
function getNonce() {
  return _nonce++;
}

export const ColumnListContextProvider = ({initColSpec, children}) => {
  const [columns, setColumns] = useState({
    keys: [{colSpec: initColSpec, id: getNonce()}],
    fst: 0, // first visible column from the left.
    num: 1, // number of visible columns on the screen.
    focus: 0, // The column currently in focus. (TODO: Implement further.)
  });

  const columnListManager = useMemo(() => (
    new ColumnListManager(columns, setColumns, 3)
  ), [columns]);

  return (
    <ColumnListContext.Provider value={[columns, columnListManager]}>
      {children}
    </ColumnListContext.Provider>
  );
};

export class ColumnListManager {
  constructor(columns, setColumns, maxColNum) {
    this.columns = columns;
    this.setColumns = setColumns;
    this.maxColNum = maxColNum;
  }

  openColumn = (callerKey, newColSpec, isToTheLeft) => {
    // If newColSpec is not an object, interpret it as an entID.
    if (typeof newColSpec !== "object") {
      newColSpec = {entID: newColSpec};
    }

    let columns = this.columns;

    // Find caller column's index.
    let callerID = callerKey.id;
    let callerInd = columns.keys.findIndex(val => val.id == callerID);

    // Create and insert the new column key in columns.keys, and potentially
    // increase fst.
    let fst = columns.fst;
    if (!isToTheLeft && fst + columns.num - 1 == callerInd) {
      fst++;
    }
    let newInd = isToTheLeft ? callerInd : callerInd + 1;
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys.slice(0, newInd).concat(
        // [JSON.stringify({entID: newColSpec, n: newN})],
        [{colSpec: newColSpec, id: getNonce()}],
        columns.keys.slice(newInd)
      ),
      fst: fst,
      focus: newInd,
    }));
  };

  closeColumn = (callerKey) => {
    let columns = this.columns;

    // Find caller column's index.
    let callerID = callerKey.id;
    let callerInd = columns.keys.findIndex(val => val.id == callerID);

    // Remove the column key in columns.keys, and potentially reduce fst.
    let fst = columns.fst;
    while (fst > 0 && fst + columns.num > columns.keys.length) {
      fst--;
    }
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys.slice(0, callerInd).concat(
        columns.keys.slice(callerInd + 1)
      ),
      fst: fst,
    }));
  };

  cycleLeft = () => {
    let columns = this.columns;
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys,
      fst: columns.fst <= 0 ? 0 : columns.fst - 1,
      // TODO: Consider changing focus to the leftmost column, but maybe focus
      // just shouldn't be changed.
    }));
  };
  cycleRight = () => {
    let columns = this.columns;
    let max = Math.max(columns.keys.length - columns.num, 0);
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys,
      fst: columns.fst >= max ? max : columns.fst + 1,
    }));
  };

  increaseColNum = () => {
    this.setColumns(prev => ({
      ...prev,
      num: prev.num < this.maxColNum ? prev.num + 1 : prev.num,
    }));
  };
  decreaseColNum = () => {
    this.setColumns(prev => ({
      ...prev,
      num: prev.num - 1 ? prev.num - 1 : 1,
    }));
  };

}



export const ColumnContextProvider = ({colKey, children}) => {
  const [, columnListManager] = useContext(ColumnListContext);

  const columnManager = useMemo(() => (
    new ColumnManager(columnListManager, colKey)
  ), [columnListManager, colKey]);

  // const columnEntID = JSON.parse(colKey).entID;
  return (
    <ColumnContext.Provider value={[colKey, columnManager]}>
      {children}
    </ColumnContext.Provider>
  );
};

export class ColumnManager {
  constructor(columnListManager, colKey) {
    this.columnListManager = columnListManager;
    this.colKey = colKey;
  }

  openColumn = (newColSpec, isToTheLeft) => {
    this.columnListManager.openColumn(this.colKey, newColSpec, isToTheLeft);
  }
  closeColumn = () => {
    this.columnListManager.closeColumn(this.colKey);
  }


  getColKey = () => {
    return this.colKey;
  }
  getSearch = () => {
    return "?from=" + this.colKey;
  }
}