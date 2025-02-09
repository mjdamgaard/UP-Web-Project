


export class PriorityCache {

  constructor(cacheLimit, halftime_s) {
    this.limit = cacheLimit;
    this.cache = [];
    this.cacheKeys = [];
    this.halftime_ms = halftime_s * 1000;
    this.nextDecayTime = Date.now() + this.halftime_ms;
  }

  get(key) {
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


  set(key, val) {
    key = key.toString();
    let cache = this.cache;
    let len = cache.length;
    let i = (len < this.limit) ? len : len - 1;
    let priority = cache[i - 1] + 1;
    cache[i] = [val, priority];
    this.#updatePosition(i, val, priority, key, cache, this.cacheKeys);
    let now = Date.now();
    if (now > this.nextDecayTime) {
      this.#decay(now);
    }
    return;
  }


  #updatePosition(i, val, priority, key, cache, cacheKeys) {
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
    return;
  }

  #decay(now) {
    let timeSinceLastDecay = now - (this.nextDecayTime - this.halftime_ms);
    let decayFactor = 2 ** (-timeSinceLastDecay / this.halftime_ms);
    this.cache = this.cache.filter(([, priority], ind, arr) => {
      let newPriority = priority * decayFactor;
      arr[ind][1] = newPriority;
      return (newPriority > 1);
    });
    this.nextDecayTime = now + this.halftime_ms;
  }

}
