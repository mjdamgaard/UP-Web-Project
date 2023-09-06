
import {createContext} from "react";

export const ColumnsContext = createContext();

export class ColumnManager {
  constructor(columns, setColumns) {
    this.columns = columns;
    this.setColumns = setColumns;
  }

  openColumn(callerKey, newEntID, isToTheLeft) {
    // find caller column's index.
    let callerInd = this.columns.keys.findIndex(val => val == callerKey);
    // get the new n for the new key if one or more columns with the same entID
    // already exists.
    let newN = this.columns.keys.reduce(
      (acc, val) => val.entID != newEntID ? acc : (val.n > acc ? val.n : acc),
      0
    );
    // create and insert the new column key in columns.keys, and potentially
    // increase fst.
    let fst = this.columns.fst;
    if (!isToTheLeft && fst + this.columns.num - 1 == callerInd) {
      fst++;
    }
    let newInd = isToTheLeft ? callerInd : callerInd + 1;
    this.setColumns(prev => ({
      ...prev,
      keys: this.columns.keys.slice(0, newInd).concat(
        [{entID: newEntID, n: newN}],
        this.columns.keys.slice(newInd)
      ),
      fst: fst,
      focus: newInd,
    }));
  }
  closeColumn(callerKey) {
    // find caller column's index.
    let callerInd = this.columns.keys.findIndex(val => val == callerKey);
    // remove the column key in columns.keys, and potentially reduce fst.
    let fst = this.columns.fst;
    while (fst > 0 && fst + this.columns.num > this.columns.keys.length) {
      fst--;
    }
    this.setColumns(prev => ({
      ...prev,
      keys: this.columns.keys.slice(0, callerInd).concat(
        this.columns.keys.slice(callerInd + 1)
      ),
      fst: fst,
    }));
  }

  cycleLeft() {
    this.setColumns(prev => ({
      ...prev,
      keys: this.columns.keys,
      fst: this.columns.fst <= 0 ? 0 : this.columns.fst - 1,
      // TODO: Consider changing focus to the leftmost column, but maybe focus
      // just shouldn't be changed.
    }));
  }
  cycleRight() {
    let max = Math.max(this.columns.keys.length - this.columns.num, 0);
    this.setColumns(prev => ({
      ...prev,
      keys: this.columns.keys,
      fst: this.columns.fst >= max ? max : this.columns.fst + 1,
    }));
  }
}