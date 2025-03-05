
import GeneralCache from "./GeneralCache.js";



export class PriorityCache extends GeneralCache {

  constructor(limit) {
    super();
    this.limit = limit;
  }

  // entry = [value, priority].

  get minPriority() {
    return this.getFirstEntry()[1];
  }
  get maxPriority() {
    return this.getLastEntry()[1];
  }


  get(key, priority = 1) {
    let entry = this.getEntry(key);
    if (entry !== undefined) {
      this.updateCurElemEntry(entry => entry[1] += priority);
      this.moveCurElemUpWhile((entry, nextEntry) => entry[1] > nextEntry[1]);
    }
    return entry[0];
  }

  set(key, val, evictionCallback = () => {}, priority = 1) {
    let didExist = this.setPrevOrAppendNewElem(key, [val, 1], entry => {
      entry[0] = val;
      entry[1] += priority;
    });
    if (didExist) {
      this.moveCurElemUpWhile((entry, nextEntry) => entry[1] > nextEntry[1]);
    }
    else if (this.size > this.limit) {
      this.evictFirstElem((key, [val, priority]) => {
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


export {PriorityCache as default};
