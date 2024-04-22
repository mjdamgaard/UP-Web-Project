
import {DBRequestManager} from "../classes/DBRequestManager.js";




export class EntityInserter {
  #idOrCallbackArrStore = {};

  // constructor() {

  // }


  insertOrFind(entDefObj) {
    // If entDefObj is an array, call this method on each element and return.
    if (Array.isArray(entDefObj)) {
      entDefObj.forEach(val => (this.insertOrFind(val)));
      return;
    }

    // Else check the meta type of the entDefObj, and branch accordingly.
    switch (entDefObj.metaType) {
      case 'd':
        break;
      case 's':
        break;
      case 'f':
        break;
      case 'p':
        break;
      case 't':
        break;
      case 'b':
        throw "EntityInserter: Binaries are not implemented yet.";
      case 'u':
        throw "EntityInserter: Users cannot be inserted.";
      case 'a':
        throw "EntityInserter: Aggregation bots cannot be inserted.";
      default:
        throw "EntityInserter: Unrecognized meta type.";
    }

  }



  /* The methods below should be treated like private methods. They are
   * only public because they need to be called from callback functions.
  **/


  storeEntID(key, entID) {
    let callbackArr = this.#idOrCallbackArrStore[key] ?? [];

    // Verify that the callback array is not already replaced with an ID by
    // an earlier call to this method.
    if (typeof callbackArr !== "object") {
      throw (
        'EntityInserter: The key "' + key + '" is already used.'
      );
    }

    // Call all the callbacks with the entID (and key) as input, then exchange
    // the callback array for the entID.
    callbackArr.forEach(callback => {
      callback(entID, key);
    });
    this.#idOrCallbackArrStore[key] = entID;
    return;
  }
  
  inputEntity(reqData, key) {
    if (key) {
      DBRequestManager.input(this, reqData, (obj, result) => {
        obj.storeEntID(key, result.outID);
      });
    } else {
      DBRequestManager.input(this, reqData, () => {});
    }
  }

}
