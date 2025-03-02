
import {IDTree} from "./IDTree.js";




export class GeneralCache {

  constructor() {
    this.cache = new IDTree();
    this.headRef = [null, undefined];
    this.tailEndRef = [this.headRef, null];
    this.headRef[1] = this.tailEndRef;
    this.size = 0;
    this.curElem = undefined;
  }


  // cache = new IDTree,
  // elem = [prevElem, nextElem, key, entry].

  getCurEntry() {
    return this.curElem[3];
  }

  getCurKey() {
    return this.curElem[2];
  }

  getCurKeyAndEntry() {
    return [this.curElem[2], this.curElem[3]];
  }


  getEntry(key) {
    let elem = this.curElem = this.cache.get(key);
    return elem ? elem[3] : undefined;
  }

  getFirstEntry() {
    let firstElem = this.curElem = this.headRef[1];
    return (firstElem === this.tailEndRef) ? undefined : firstElem[3];
  }

  getLastEntry() {
    let lastElem = this.curElem = this.tailEndRef[0];
    return (lastElem === this.headRef) ? undefined : lastElem[3];
  }


  setPrevOrAppendNewElem(key, entry, updateCallback) {
    let newElem = [undefined, undefined, key, entry];
    let didExist = this.cache.set(key, newElem, elem => {
      this.curElem = elem;
      let prevEntry = elem[3];
      let newEntry = updateCallback(prevEntry);
      elem[3] = newEntry ?? prevEntry;
    });
    if (!didExist) {
      elem[0] = this.headRef;
      elem[1] = this.headRef[1];
      this.headRef[1][0] = elem;
      this.headRef[1] = elem;
      this.curElem = elem;
      this.size++;
    }
    return didExist;
  }

  updateEntry(key, updateCallback) {
    let elem = this.curElem = this.cache.get(key);
    if (elem) {
      let prevEntry = elem[3];
      let newEntry = updateCallback(prevEntry);
      elem[3] = newEntry ?? prevEntry;
      return true;
    } else {
      return false;
    }
  }

  updateCurElemEntry(updateCallback) {
    let prevEntry = this.curElem[3];
    let newEntry = updateCallback(prevEntry);
    this.curElem[3] = newEntry ?? prevEntry;
  }

  moveCurElemInFront() {
    let elem = this.curElem;
    elem[0][1] = elem[1];
    elem[1][0] = elem[0];
    elem[0] = this.headRef;
    elem[1] = this.headRef[1];
    this.headRef[1] = elem;
  }

  moveCurElemUpWhile(condCallback = (curEntry, nextEntry) => false) {
    let curElem = this.curElem;
    let prevElem = curElem[0];
    let nextElem = curElem[1];
    while (
      nextElem !== this.tailEndRef && condCallback(curElem[3], nextElem[3])
    ) {
      // Move element up in queue.
      prevElem[1] = nextElem;
      curElem[1] = nextElem[1];
      curElem[0] = nextElem;
      nextElem[0] = prevElem;
      nextElem[1] = curElem;
      // Update what prevElem and nextElem refers to.
      prevElem = curElem[0];
      nextElem = curElem[1];
    }
  }

  evictElem(key, evictionCallback) {
    return this.cache.remove(key, elem => {
      this.curElem = undefined;
      elem[0][1] = elem[1];
      elem[1][0] = elem[0];
      this.size--;
      evictionCallback(elem[2], elem[3]);
    });
  }

  evictFirstElem(evictionCallback) {
    let key = this.headRef[1][2];
    this.evictElem(key, evictionCallback);
  }

  evictLastElem(evictionCallback) {
    let key = this.tailEndRef[0][2];
    this.evictElem(key, evictionCallback);
  }

  evictCurElem(evictionCallback) {
    let key = this.curElem[2];
    this.evictElem(key, evictionCallback);
    this.curElem = undefined;
  }


  forEach(callback) {
    let size = this.size;
    let nextElem = this.headRef[1];
    let key, entry;
    for (let i = 0; i < size; i++) {
      [ , nextElem, key, entry] = nextElem;
      callback(entry, i, key);
    }
  }

}


export {GeneralCache as default};
