
import {LRUCache} from "./LRUCache.js";
import {PriorityCache} from "./PriorityCache.js";


export class CombinedCache {

  constructor(
    lruCacheLimit, priorityCachelimit,
    numOfSetsBeforeDecay = Infinity, decayFactor = 0.9
  ) {
    this.lruCache = new LRUCache(lruCacheLimit);
    this.priorityCache = new PriorityCache(priorityCachelimit);
    this.numOfSetsBeforeDecay = numOfSetsBeforeDecay;
    this.decayFactor = decayFactor;
    this.curNumOfSets = 0;
  }


  get(key, priority = 1) {
    // First try to get from the priority cache.
    let ret = this.priorityCache.get(key, priority);

    // Then if not found there, get from the LRU cache, and if the
    // count/priority of the the gotten element, if any, exceeds priorityCache
    // .minPriority, swap the element with the first element of the priority
    // cache.
    if (ret === undefined) {
      ret = this.lruCache.get(key, priority, (key, val, count) => {
        let ret = [key, val, count];
        if (count > this.priorityCache.minPriority) {
          // Returning null will remove the gotten (now first) element of the
          // LRU cache.
          ret = null;
          this.priorityCache.set(
            key, val, count, (firstKey, firstVal, firstPriority) => {
              // This will transform the first element of the LRU cache.
              ret = [firstKey, firstVal, firstPriority];
            }
          );
        }
        return ret;
      });
    }
    return ret;
  }


  set(key, val, evictionCallback = () => {}, priority = 1) {
    // Insert the element in the LRU cache, unless minPriority is less than
    // priority.
    if (this.priorityCache.minPriority < priority) {
      this.priorityCache.set(key, val, priority);
    } else {
      this.lruCache.set(key, val, undefined, priority);
    }

    // Then check if it is time for the priorities in the priority cache to
    // decay.
    if (this.numOfSetsBeforeDecay < ++this.curNumOfSets) {
      this.decay();
    }
  }


  decay(decayFactor) {
    decayFactor ??= this.decayFactor;
    this.curNumOfSets = 0;
    Object.values(this.priorityCache).forEach(entry => {
      entry[3] *= decayFactor;
    });
  }

}


export {CombinedCache as default};
