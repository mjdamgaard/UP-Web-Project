
import {LRUCache} from "./LRUCache.js";
import {PriorityDecayCache} from "./PriorityDecayCache.js";


export class CombinedCache {

  constructor(
    lruCacheLimit, priorityCachelimit, decayFactorPerSet,
  ) {
    this.lruCache = new LRUCache(lruCacheLimit);
    this.priorityCache = new PriorityDecayCache(
      priorityCachelimit, decayFactorPerSet
    );
  }

  // entry = [value, priority].

  get size() {
    return this.lruCache.size + this.priorityCache.size;
  }


  get(key, priority = 1) {
    // First try to get from the priority cache.
    let ret = this.priorityCache.get(key, priority);

    // Then if not found there, get from the LRU cache, and if the
    // count/priority of the the gotten entry, if any, exceeds priorityCache
    // .minPriority, swap the entry with the first entry of the priority
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
    // Insert the entry in the LRU cache, unless minPriority is less than
    // priority.
    if (this.priorityCache.minPriority < priority) {
      this.priorityCache.set(key, val, priority);
    } else {
      this.lruCache.set(key, val, undefined, priority);
    }

    // Tick the priority-decay cache regardless of where the entry was inserted.
    this.priorityCache.tick();
  }


  remove(key) {
    let wasDeleted = this.priorityCache.remove(key);
    if (!wasDeleted) {
      wasDeleted = this.lruCache.remove(key);
    }
    return wasDeleted;
  }


}


export {CombinedCache as default};
