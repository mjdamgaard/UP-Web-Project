


export class PriorityLRUCache {

  constructor(cacheLimit, maxPriority) {
    this.limit = cacheLimit;
    this.maxPriority = maxPriority ? Math.min(maxPriority, 1E+15) : 1E+15;
    this.cache = [];
    this.cacheKeys = [];
  }

  static get(key) {
    key = key.toString();
    let cache = this.cache;
    let cacheKeys = this.cacheKeys;
    let i = cacheKeys.indexOf(key);
    if (i === -1) {
      return undefined
    };
    let val = cache[i][0];
    let priority = ++cache[i][1];
    this.#updatePosition(i, val, priority, key, cache, cacheKeys);
    return val;
  }


  static set(key, val) {
    key = key.toString();
    let cache = this.cache;
    let len = cache.length;
    let i = (len < this.limit) ? len : len - 1;
    let priority = cache[i - 1] + 1;
    cache[i] = [val, priority];
    this.#updatePosition(i, val, priority, key, cache, this.cacheKeys);
    return;
  }


  static #updatePosition(i, val, priority, key, cache, cacheKeys) {
    if (i > 0) {
      let [nextVal, nextPriority] = cache[i - 1];
      if (priority > nextPriority) {
        cache[i] = [nextVal, nextPriority];
        cache[i - 1] = [val, priority];
        let nextKey = (cacheKeys[i] = cacheKeys[i - 1]);
        cacheKeys[i - 1] = key;
        this.#updatePosition(i- 1, val, priority, nextKey, cache, cacheKeys);
      }
    }
    if (priority > this.maxPriority) {
      this.cache = cache.map(
        ([val, priority]) => [val, Math.ceil(priority/10)]
      );
    }
    return;
  }

}
