



export class CombinedCache {

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
    // First try to get from the priority cache, then from LRU cache.
    let ret = this.priorityCache.get(key, priority);
    if (ret === undefined) {
      ret = this.lruCache.get(key, priority);
    }
    return ret;
  }


  set(key, val, evictionCallback = () => {}, priority = 1) {
    // Insert first in the LRU cache, and if an element is evicted, see if its
    // count/priority exceeds priorityCache.minPriority. In case it does,
    // insert it in the priority cache, and if an entry is evicted from the
    // priority cache as a consequence insert it back into the LRU cache with
    // a recursive call to this method. This method then halts once an element
    // in the LRU cache is reached with a lower priority than the current
    // minPriority.

    // First define a callback for the potential eviction from the LRU cache.
    let callback = ((lastKey, lastVal, lastPriority) => {
      // If the priority of the LRU-cache-evicted element exceeds minPriority,
      // insert it in the priority cache.
      if (lastPriority > this.priorityCache.minPriority) {
        // Define callback in case of an eviction from the priority cache.
        let callback = ((firstKey, firstVal, firstPriority) => {
          // If an element is evicted from the priority cache, call the outer
          // method again recursively, with the same input evictionCallback.
          this.set(firstKey, firstVal, evictionCallback, firstPriority);
        }).bind(this);

        // Then insert the LRU-cache-evicted element into the priority cache.
        this.priorityCache.set(key, val, priority, callback);
      }
      else {
        // If and when minPriority is not exceeded, and by calling
        // evictionCallback on the final LRU-cache-evicted element.
        evictionCallback(lastKey, lastVal, lastPriority);
      }
    }).bind(this);

    // Before we insert into the LRU cache, check if it is time for the
    // priorities in the priority cache to decay.
    if (this.numOfSetsBeforeDecay < ++this.curNumOfSets) {
      this.decay();
    }

    // Then set all this in motion by inserting into the LRU-cache, with the
    // recursive callback just defined.
    this.lruCache.set(key, val, callback, priority);
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

  get(key, count = 1) {
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

      // Evict last entry if the cache is full.
      if (this.limit < ++this.entryNum) {
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
