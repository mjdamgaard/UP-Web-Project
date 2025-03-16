
import {LRUCache} from "./LRUCache.js";
import {PriorityCache} from "./PriorityCache.js";


export class CombinedCache {

  constructor(lruCacheLimit, priorityCachelimit, decayFactor = 0.95) {
    this.lruCache = new LRUCache(lruCacheLimit);
    this.priorityCache = new PriorityCache(priorityCachelimit);
    this.decayFactor = decayFactor;
    this.limitSum = lruCacheLimit + priorityCachelimit;
    this.curNumOfSets = 0;
  }

  // entry = [value, priority].

  get size() {
    return this.lruCache.size + this.priorityCache.size;
  }


  get(key, priority = 1) {
    // First try to get from the priority cache.
    let ret = this.priorityCache.get(key, priority);

    // Then if not found there, get from the LRU cache, and if the
    // count/priority of the the gotten element, if any, exceeds priorityCache
    // .minPriority, swap the element with the first element of the priority
    // cache.
    if (ret === undefined) {
      ret = this.lruCache.get(key, priority);
      let firstPriority = this.lruCache.firstEntryPriority;
      if (ret && firstPriority > this.priorityCache.minPriority) {
        this.priorityCache.set(key, ret, firstPriority);
        this.lruCache.remove(key);
      }
    }
    return ret;
  }


  set(key, val, priority = 1) {
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


  remove(key) {
    let wasDeleted = this.priorityCache.remove(key);
    if (!wasDeleted) {
      wasDeleted = this.lruCache.remove(key);
    }
    return wasDeleted;
  }




  decay(decayFactor) {
    decayFactor ??= this.decayFactor;
    this.curNumOfSets = 0;
    this.priorityCache.forEach((entry) => {
      entry[1] *= decayFactor;
    });
  }

}


export {CombinedCache as default};
