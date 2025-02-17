


export default class CombinedCache {

  constructor(
    lruCacheLimit, priorityCachelimit,
    numOfSetsBeforeDecay = Infinity, decayFactor = 0.9
  ) {
    this.lruCache = new PriorityCache(lruCacheLimit);
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






export class PriorityCache {

  constructor(limit) {
    this.limit = limit;
    this.cache = {};
    this.firstEntry = [undefined, [], undefined, 0];
    this.virtualLastEntry = [undefined, this.firstEntry, [], Infinity];
    this.firstEntry[2] = this.virtualLastEntry;
    this.entryNum = 1;
  }

  // cache = {["#" + key]: entry, ...},
  // entry = [value, prevEntry, nextEntry, priority, key].

  get minPriority() {
    return this.firstEntry[1];
  }
  get maxPriority() {
    return this.lastVirtualEntry[2][1];
  }


  get(key, priority = 1) {
    let safeKey = "#" + key;
    let entry = this.cache[safeKey];

    if (entry) {
      // Increase priority.
      entry[3] += priority;

      // Update queue.
      this.#moveEntryUpToRightPlace(entry);

      // Return value.
      return entry[0];
    }
    else {
      return undefined;
    }
  }


  set(key, val, priority = 1, evictionCallback = () => {}) {
    let safeKey = "#" + key;
    let entry = this.cache[safeKey];

    if (entry) {
      // Set new value and increase priority.
      entry[0] = val;
      entry[3] += priority;

      // Update queue.
      this.#moveEntryUpToRightPlace(entry);
    }
    else {
      // Insert new entry.
      let entry = [val, [], this.firstEntry, priority, key];
      this.cache[safeKey] = entry;
      this.firstEntry[1] = entry;
      this.firstEntry = entry;

      // Update queue.
      this.#moveEntryUpToRightPlace(entry);

      // Evict first entry if the cache is full.
      if (this.limit < ++this.entryNum) {
        let [firstVal,,, firstPriority, firstKey] = this.firstEntry;
        this.firstEntry = this.firstEntry[2];
        this.firstEntry[1] = [];
        delete this.cache["#" + firstKey];
        this.entryNum--;
  
        // Call evictionCallback() on the properties of the evicted entry.
        evictionCallback(firstKey, firstVal, firstPriority);
      }
    }
  }


  #moveEntryUpToRightPlace(entry) {
    let nextEntry = entry[2];
    let prevEntry = entry[1];
    while (entry[3] > nextEntry[3]) {
      // Move the element up one place.
      entry[2] = nextEntry[2];
      entry[1] = nextEntry;
      nextEntry[2] = entry;
      nextEntry[1] = prevEntry;
      prevEntry[2] = nextEntry;

      // Update what nextEntry refers to.
      nextEntry = entry[2];
    }
  }

}







export class LRUCache {

  constructor(limit) {
    this.limit = limit;
    this.cache = {};
    this.firstEntry = [undefined, null, undefined];
    this.lastEntry = [undefined, this.firstEntry, null];
    this.firstEntry[2] = this.lastEntry;
    this.entryNum = 2;
  }

  // cache = {["#" + key]: entry, ...},
  // entry = [value, prevEntry, nextEntry, key, touchedCount].

  get(key, count = 1, update = (key, val, count) => [key, val, count]) {
    let safeKey = "#" + key;
    let entry = this.cache[safeKey];

    if (entry) {
      // Increase count.
      entry[4] += count;

      // Update queue.
      entry[1][2] = entry[2];
      entry[2][1] = entry[1];
      entry[1] = null;
      entry[2] = this.firstEntry;
      this.firstEntry[1] = entry;
      this.firstEntry = entry;

      // Call optional update function to potentially change the new first
      // entry.
      [entry[3], entry[0], entry[4]] = update(entry[3], entry[0], entry[4]) ||
        [];
      if (entry[3] !== key) {
        if (entry[0] !== undefined) {
          // Update this.cache as well, if the returned value is not undefined.
          delete this.cache[safeKey];
          this.cache["#" + entry[3]] = entry;
        } else {
          // Else simply remove the first entry entirely.
          delete this.cache[safeKey];
          this.firstEntry = this.firstEntry[2];
          this.firstEntry[1] = null;
          this.entryNum--;
        }
      }

      // Return value.
      return entry[0];
    }
    else {
      return undefined;
    }
  }


  set(key, val, evictionCallback = () => {}, count = 1) {
    let safeKey = "#" + key;
    let entry = this.cache[safeKey];

    if (entry) {
      // Set new value and increase count.
      entry[0] = val;
      entry[4] += count;

      // Update queue.
      entry[1][2] = entry[2];
      entry[2][1] = entry[1];
      entry[1] = null;
      entry[2] = this.firstEntry;
      this.firstEntry[1] = entry;
      this.firstEntry = entry;
    }
    else {
      // Insert new entry.
      let entry = [val, null, this.firstEntry, key, count];
      this.cache[safeKey] = entry;
      this.firstEntry[1] = entry;
      this.firstEntry = entry;
      this.entryNum++;

      // Evict last entry if the cache is full.
      if (this.limit < this.entryNum) {
        let [lastVal,,, lastKey, lastCount] = this.lastEntry;
        this.lastEntry = this.lastEntry[1];
        this.lastEntry[2] = null;
        delete this.cache["#" + lastKey];
        this.entryNum--;
  
        // Call evictionCallback() on the properties of the evicted entry.
        evictionCallback(lastKey, lastVal, lastCount);
      }
    }
  }

}
