
import {IDTree} from "./IDTree.js";




export class GeneralCache {

  constructor() {
    this.cache = new IDTree();
    this.headRef = [null, undefined];
    this.tailEndRef = [this.headRef, null];
    this.headRef[1] = this.tailEndRef;
    this.size = 0;
    this.curEntry = undefined;
  }


  // cache = new IDTree,
  // entry = [prevEntry, nextEntry, key, val].

  getCurVal() {
    return this.curEntry[3];
  }

  getCurKey() {
    return this.curEntry[2];
  }

  getCurKeyAndVal() {
    return [this.curEntry[2], this.curEntry[3]];
  }


  getVal(key) {
    let entry = this.curEntry = this.cache.get(key);
    return entry ? entry[3] : undefined;
  }

  getFirstVal() {
    let firstEntry = this.curEntry = this.headRef[1];
    return (firstEntry === this.tailEndRef) ? undefined : firstEntry[3];
  }

  setPrevOrAppendNewEntry(key, val, updateCallback) {
    let newEntry = [undefined, undefined, key, val];
    let didExist = this.cache.set(key, newEntry, entry => {
      this.curEntry = entry;
      let prevVal = entry[3];
      let newVal = updateCallback(prevVal);
      entry[3] = newVal ?? prevVal;
    });
    if (!didExist) {
      entry[0] = this.headRef;
      entry[1] = this.headRef[1];
      this.headRef[1][0] = entry;
      this.headRef[1] = entry;
      this.curEntry = entry;
      this.size++;
    }
    return didExist;
  }

  updateEntryVal(key, updateCallback) {
    let entry = this.curEntry = this.cache.get(key);
    if (entry) {
      let prevVal = entry[3];
      let newVal = updateCallback(prevVal);
      entry[3] = newVal ?? prevVal;
      return true;
    } else {
      return false;
    }
  }

  updateCurEntryVal(updateCallback) {
    let prevVal = this.curEntry[3];
    let newVal = updateCallback(prevVal);
    this.curEntry[3] = newVal ?? prevVal;
  }

  moveCurEntryInFront() {
    let entry = this.curEntry;
    entry[0][1] = entry[1];
    entry[1][0] = entry[0];
    entry[0] = this.headRef;
    entry[1] = this.headRef[1];
    this.headRef[1] = entry;
  }

  moveCurEntryUpAndGetIsLastEntry() {
    let entry = this.curEntry;
    let prevEntry = entry[0];
    let nextEntry = entry[1];
    prevEntry[1] = nextEntry;
    entry[1] = nextEntry[1];
    entry[0] = nextEntry;
    nextEntry[1] = entry;
    nextEntry[0] = prevEntry;
    return entry[1] === this.tailEndRef[0];
  }

  evictEntry(key, evictionCallback) {
    return this.cache.remove(key, entry => {
      this.curEntry = undefined;
      entry[0][1] = entry[1];
      entry[1][0] = entry[0];
      this.size--;
      evictionCallback(entry[2], entry[3]);
    });
  }

  evictFirstEntry(evictionCallback) {
    let key = this.headRef[1][2];
    this.evictEntry(key, evictionCallback);
  }

  evictLastEntry(evictionCallback) {
    let key = this.tailEndRef[0][2];
    this.evictEntry(key, evictionCallback);
  }

  evictCurEntry(evictionCallback) {
    let key = this.curEntry[2];
    this.evictEntry(key, evictionCallback);
    this.curEntry = undefined;
  }


  forEach(callback) {
    let size = this.size;
    let nextEntry = this.headRef[1];
    let key, val;
    for (let i = 0; i < size; i++) {
      [ , nextEntry, key, val] = nextEntry;
      callback(val, i, key);
    }
  }

}


export {GeneralCache as default};
