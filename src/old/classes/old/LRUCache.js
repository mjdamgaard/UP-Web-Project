
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

  get firstEntryCount() {
    return this.firstEntry[4];
  }


  // cache = {["#" + key]: entry, ...},
  // entry = [value, prevEntry, nextEntry, key, touchedCount].

  get(key, count = 1) {
    let entry = this.cache.get(key);

    if (entry) {
      // Increase count.
      entry[4] += count;

      // Update queue.
      if (entry[1]) entry[1][2] = entry[2];
      if (entry[2]) entry[2][1] = entry[1];
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
    let entry = this.cache.get(key);

    if (entry) {
      // Set new value and increase count.
      entry[0] = val;
      entry[4] += count;

      // Update queue.
      if (entry[1]) entry[1][2] = entry[2];
      if (entry[2]) entry[2][1] = entry[1];
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
        this.cache.remove(lastKey);
        this.entryNum--;
  
        // Call evictionCallback() on the properties of the evicted entry.
        evictionCallback(lastKey, lastVal, lastCount);
      }
    }
  }


  remove(key) {
    let entry = this.cache.get(key);

    if (entry) {
      // Remove entry from cache and update the queue.
      this.cache.remove(key);
      if (this.firstEntry === entry) {
        this.firstEntry[0] = undefined;
        this.firstEntry[3] = undefined;
        this.firstEntry[4] = 0;
      }
      else if (this.lastEntry === entry) {
        this.lastEntry[0] = undefined;
        this.lastEntry[3] = undefined;
        this.firstEntry[4] = 0;
      }
      else {
        entry[1][2] = entry[2];
        entry[2][1] = entry[1];
      }
      return true;
    }
    return false;
  }


}


export {LRUCache as default};
