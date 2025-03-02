
import {IDTree} from "../caching/IDTree.js";



export class ExpiryCache {

  constructor(limit, delay, evictionCallback) {
    this.limit = limit;
    this.cache = new IDTree();
    this.entryNum = 0;
    setInterval(() => this.evictAllExpired(evictionCallback), delay);
  }

  // cache = {["#" + key]: entry, ...},
  // entry = [value, key, expiryTime].

  get(key, update = (key, val, expiryTime) => [key, val, expiryTime]) {
    let entry = this.cache.get(key);

    [entry[1], entry[0], entry[2]] = update(entry[1], entry[0], entry[2]);

    return entry[0];
  }


  set(key = this.entryNum + 1, val, expiryTime) {
    if (this.entryNum >= this.limit) {
      return false;
    }
    this.entryNum++;
    this.cache.set(key, [val, key, expiryTime]);
    return key;
  }


  remove(key) {
    let wasRemoved = this.cache.remove(key);
    if (wasRemoved) this.entryNum--;
    return wasRemoved;
  }


  evictAllExpired(evictionCallback = () => {}) {
    let now = Date.now()
    this.cache.forEach(([val, key, expiryTime]) => {
      if (expiryTime < now) {
        this.cache.remove(key);
        evictionCallback(key, val, expiryTime);
      }
    });
  }

}


export {ExpiryCache as default};




export class ExpiryCacheWAutomaticKeys extends ExpiryCache {
  constructor(limit, delay, evictionCallback) {
    super(limit, delay, evictionCallback);
  }

  set(val, expiryTime) {
    let key = this.entryNum + 1
    if (this.entryNum >= this.limit) {
      return false;
    }
    this.entryNum++;
    this.cache.set(key, [val, key, expiryTime]);
    return key;
  }
}
