import {createContext, useContext, useState, useMemo} from "react";

export const ColumnContext = createContext();

export const ColumnListContext = createContext();


export const ColumnListContextProvider = ({initColKey, children}) => {
  const [columns, setColumns] = useState({
    keys: [initColKey],
    fst: 0, // first visible column from the left.
    num: 1, // number of visible columns on the screen.
    focus: 0, // The column currently in focus. (TODO: Implement further.)
  });

  const columnListManager = useMemo(() => (
    new ColumnListManager(columns, setColumns)
  ), []);

  return (
    <ColumnListContext.Provider value={[columns, columnListManager]}>
      {children}
    </ColumnListContext.Provider>
  );
};

export class ColumnListManager {
  constructor(columns, setColumns) {
    this.columns = columns;
    this.setColumns = setColumns;
  }

  openColumn = (callerKey, newEntID, isToTheLeft) => {
    let columns = this.columns;
    // find caller column's index.
    let callerInd = columns.keys.findIndex(val => val == callerKey);
    // get the new n for the new key if one or more columns with the same entID
    // already exists.
    let newN = 1 + columns.keys.map(val => JSON.parse(val)).reduce(
      (acc, val) => val.entID != newEntID ? acc : (val.n > acc ? val.n : acc),
      0
    );
    // create and insert the new column key in columns.keys, and potentially
    // increase fst.
    let fst = columns.fst;
    if (!isToTheLeft && fst + columns.num - 1 == callerInd) {
      fst++;
    }
    let newInd = isToTheLeft ? callerInd : callerInd + 1;
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys.slice(0, newInd).concat(
        [JSON.stringify({entID: newEntID, n: newN})],
        columns.keys.slice(newInd)
      ),
      fst: fst,
      focus: newInd,
    }));
  }
  closeColumn = (callerKey) => {
    let columns = this.columns;
    // find caller column's index.
    let callerInd = columns.keys.findIndex(val => val == callerKey);
    // remove the column key in columns.keys, and potentially reduce fst.
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
  }

  cycleLeft = () => {
    let columns = this.columns;
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys,
      fst: columns.fst <= 0 ? 0 : columns.fst - 1,
      // TODO: Consider changing focus to the leftmost column, but maybe focus
      // just shouldn't be changed.
    }));
  }
  cycleRight = () => {
    let columns = this.columns;
    let max = Math.max(columns.keys.length - columns.num, 0);
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys,
      fst: columns.fst >= max ? max : columns.fst + 1,
    }));
  }
}

export const ColumnContextProvider = ({colKey, children}) => {
  const [, columnListManager] = useContext(ColumnListContext);

  const columnManager = useMemo(() => (
    new ColumnManager(columnListManager, colKey)
  ), [columnListManager, colKey]);

  const columnEntID = JSON.parse(colKey).entID;
  return (
    <ColumnContext.Provider value={[columnEntID, columnManager]}>
      {children}
    </ColumnContext.Provider>
  );
};

export class ColumnManager {
  constructor(columnListManager, colKey) {
    this.columnListManager = columnListManager;
    this.colKey = colKey;
  }

  openColumn = (newEntID, isToTheLeft) => {
    this.columnListManager.openColumn(this.colKey, newEntID, isToTheLeft);
  }
  closeColumn = () => {
    this.columnListManager.closeColumn(this.colKey);
  }
}