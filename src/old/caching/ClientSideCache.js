
import {CombinedCache} from "./CombinedCache.js";



export class ClientSideCache extends CombinedCache {
  
  constructor() {
    super(10^3, 10^3, 2 * 10^3);
    this.queryAfter = 0
  }

  set(key, val) {
    super.set(key, [val, Date.now()]);
  }

  updateEntryTime(key) {
    let [val] = this.get(key);
    this.set(key, val);
  }

  backUpInStorage() {
    // TODO: Implement.
  }

  recoverFromStorage() {
    // TODO: Implement.
  }

}