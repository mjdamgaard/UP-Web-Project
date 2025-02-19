
import {IDTree} from "./IDTree.js";



export class LRUCache {

  constructor(limit) {
    this.limit = limit;
    this.cache = new IDTree();
    this.firstEntry = [undefined, null, undefined];
    this.lastEntry = [undefined, this.firstEntry, null];
    this.firstEntry[2] = this.lastEntry;
    this.entryNum = 2;
  }

  // cache = {["#" + key]: entry, ...},
  // entry = [value, prevEntry, nextEntry, key, touchedCount].

  get(key, count = 1, update = (key, val, count) => [key, val, count]) {
    let entry = this.cache.get(key);

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
          this.cache.delete(key);
          this.cache.set(entry[3], entry);
        } else {
          // Else simply remove the first entry entirely.
          this.cache.delete(key);
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
    let entry = this.cache.get(key);

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
      this.cache.set(key, entry);
      this.firstEntry[1] = entry;
      this.firstEntry = entry;
      this.entryNum++;

      // Evict last entry if the cache is full.
      if (this.limit < this.entryNum) {
        let [lastVal,,, lastKey, lastCount] = this.lastEntry;
        this.lastEntry = this.lastEntry[1];
        this.lastEntry[2] = null;
        this.cache.delete(lastKey);
        this.entryNum--;
  
        // Call evictionCallback() on the properties of the evicted entry.
        evictionCallback(lastKey, lastVal, lastCount);
      }
    }
  }

}


export {LRUCache as default};
