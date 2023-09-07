
import {createContext} from "react";

export const ColumnsContext = createContext();

export class ColumnManager {
  constructor(columns, setColumns) {
    this.columns = columns;
    this.setColumns = setColumns;

    this.openCoulumn = this.openColumn.bind(this);
    this.closeColumn = this.closeColumn.bind(this);
    this.cycleLeft = this.cycleLeft.bind(this);
    this.cycleRight = this.cycleRight.bind(this);
  }

  openColumn(callerKey, newEntID, isToTheLeft) {
    let columns = this.columns;
    // find caller column's index.
    let callerInd = columns.keys.findIndex(val => val == callerKey);
    // get the new n for the new key if one or more columns with the same entID
    // already exists.
    let newN = columns.keys.reduce(
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
        [{entID: newEntID, n: newN}],
        columns.keys.slice(newInd)
      ),
      fst: fst,
      focus: newInd,
    }));
  }
  closeColumn(callerKey) {
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

  cycleLeft() {
    let columns = this.columns;
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys,
      fst: columns.fst <= 0 ? 0 : columns.fst - 1,
      // TODO: Consider changing focus to the leftmost column, but maybe focus
      // just shouldn't be changed.
    }));
  }
  cycleRight() {
    let columns = this.columns;
    let max = Math.max(columns.keys.length - columns.num, 0);
    this.setColumns(prev => ({
      ...prev,
      keys: columns.keys,
      fst: columns.fst >= max ? max : columns.fst + 1,
    }));
  }
}