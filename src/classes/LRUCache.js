
import {basicEntIDs} from "../entity_ids/basic_entity_ids.js";



export class LRUCache {

  constructor(limit) {
    this.limit = limit;
    this.cache = [];
  }

  static get(key) {
    key = key.toString();
    let cache = this.cache;
    let len = cache.length;
    for (let i = 0; i < len; i++) {
      let entry = cache[i];
      if (entry[0] === key) {
        return entry[1];
      }
    }
    return undefined;
  }

  static set(key, value) {
    key = key.toString();
    let cache = this.cache;
    let len = cache.length;
    for (let i = 0; i < len; i++) {
      let entry = cache[i];
      if (entry[0] === key) {
        entry[1] = value;
      }
      return;
    }
    if (len >= limit) {
      delete cache[limit - 1];
    }
    this.cache = [[key, value]].concat(cache);
    return;
  }

}
