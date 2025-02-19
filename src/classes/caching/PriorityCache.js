
import {IDTree} from "./IDTree.js";



export class PriorityCache {

  constructor(limit) {
    this.limit = limit;
    this.cache = new IDTree();
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
    let entry = this.cache.get(key);

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
    let entry = this.cache.get(key);

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
      this.cache.set(key, entry);
      this.firstEntry[1] = entry;
      this.firstEntry = entry;

      // Update queue.
      this.#moveEntryUpToRightPlace(entry);

      // Evict first entry if the cache is full.
      if (this.limit < ++this.entryNum) {
        let [firstVal,,, firstPriority, firstKey] = this.firstEntry;
        this.firstEntry = this.firstEntry[2];
        this.firstEntry[1] = [];
        this.cache.delete(firstKey);
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


export {PriorityCache as default};
