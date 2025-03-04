
import GeneralCache from "./GeneralCache.js";
import {IDTree} from "./IDTree.js";



export class LRUCache extends GeneralCache {

  constructor(limit) {
    super();
    this.limit = limit;
  }

  // entry = [value, priority].

  get firstEntryPriority() {
    return this.getFirstEntry()[1];
  }

  get(key, priority = 1) {
    let entry = this.getEntry(key);
    if (entry !== undefined) {
      this.updateCurElemEntry(entry => entry[1] += priority);
      this.moveCurElemInFront();
    }
    return entry[0];
  }


  set(key, val, evictionCallback = () => {}, priority = 1) {
    let didExist = this.setPrevOrAppendNewElem(key, [val, 1], entry => {
      entry[0] = val;
      entry[1] += priority;
    });
    if (didExist) {
      this.moveCurElemInFront();
    }
    else if (this.size > this.limit) {
      this.evictLastElem((key, [val, priority]) => {
        evictionCallback(key, val, priority);
      });
    }
  }


  remove(key, evictionCallback) {
    return this.evictElem(key, (key, [val, priority]) => {
      evictionCallback(key, val, priority);
    });
  }


  forEach(callback) {
    super.forEach(callback);
  }

}


export {LRUCache as default};
