
import GeneralCache from "./GeneralCache.js";
import {IDTree} from "./IDTree.js";



export class LRUCache extends GeneralCache {

  constructor(limit) {
    super();
    this.limit = limit;
  }

  // entry = [value, priority].

  get firstEntryPriority() {
    return this.getFirstVal()[1];
  }

  get(key, priority = 1) {
    let val = this.getVal(key);
    if (val !== undefined) {
      this.updateCurEntryVal(entry => entry[1] += priority);
      this.moveCurEntryInFront();
    }
    return val;
  }


  set(key, val, evictionCallback = () => {}, priority = 1) {
    let didExist = this.setPrevOrAppendNewEntry(key, [val, 1], entry => {
      entry[0] = val;
      entry[1] += priority;
    });
    if (didExist) {
      this.moveCurEntryInFront();
    } else if (this.size > this.limit) {
      this.evictLastEntry((key, [val, priority]) => {
        evictionCallback(key, val, priority);
      });
    }
  }


  remove(key, evictionCallback) {
    return evictEntry(key, (key, [val, priority]) => {
      evictionCallback(key, val, priority);
    });
  }

  forEach(callback) {
    let moddedCallback = ([val, priority], ind, key) => {
      callback(val, priority, ind, key);
    };
    super.forEach(moddedCallback);
  }


}


export {LRUCache as default};
