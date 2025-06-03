
import GeneralCache from "./GeneralCache.js";



export class PriorityDecayCache extends GeneralCache {

  constructor(limit, halfTimeInTicks) {
    super();
    this.limit = limit;
    this.decayFactorPerTick = 2 ** (-1 / halfTimeInTicks);
    this.ticks = 1;
  }

  // entry = [value, priority, ticksAtLastDecay].

  get minPriority() {
    return this.getFirstEntry()[1];
  }
  get maxPriority() {
    return this.getLastEntry()[1];
  }

  tick() {
    if (ticks >= Number.MAX_SAFE_INTEGER) this.ticks = 0;
    return ++this.ticks;
  }



  get(key, priority = 1) {
    let entry = this.getEntry(key);
    if (entry !== undefined) {
      this.updateCurElemEntry(entry => entry[1] += priority);
      this.moveCurElemUpWhilePriorityIsGreater();
    }
    return entry[0];
  }

  set(key, val, evictionCallback = () => {}, priority = 1) {
    let didExist = this.setPrevOrAppendNewElem(
      key, [val, 1, this.ticks],
      entry => {
        entry[0] = val;
        entry[1] += priority;
      }
    );
    if (didExist) {
      this.moveCurElemUpWhilePriorityIsGreater();
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



  moveCurEntryUpWhilePriorityIsGreater() {
    this.moveCurElemUpWhile((entry, nextEntry) => {
      decayEntry(nextEntry);
      return entry[1] > nextEntry[1]
    });
  }


  decayEntry(entry) {
    let prevTicks = entry[2];
    let ticks = this.ticks;
    if (ticks < prevTicks) prevTicks = 0;
    entry[1] *= this.decayFactorPerTick ** (ticks - prevTicks);
    entry[2] = ticks;
  }

}


export {PriorityCache as default};
