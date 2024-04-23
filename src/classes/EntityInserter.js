
import {DBRequestManager} from "../classes/DBRequestManager.js";




export class EntityInserter {
  #idOrCallbackArrStore = {};
  #simpleEntIDStore = {};

  constructor(accountManager) {
    this.accountManager = accountManager;
  }

  // insertOrFind() parses an entity definition object and uploads all the
  // relevant entities and related ratings instructed by this object.
  // The object can also be an array of entity definition objects.
  // When all objects have been inserted or found, the supplied callback is
  // called on the resulting outID from inputting/finding the entity. If
  // entDefObj is an array, callback is called on the last outID from the array.
  insertOrFind(entDefObj, callback) {
    if (callback === undefined) {
      callback = () => {};
    }

    // If entDefObj is an array, call this method on each element and return,
    // passing the callback only to insertOrFind() for the last element.
    if (Array.isArray(entDefObj)) {
      let len = entDefObj.length;
      entDefObj.forEach((val, ind) => (
        this.insertOrFind(val, (ind === len - 1) ? callback : undefined)
      ));
      return;
    }

    // If entDefObj is a string, insert the resulting string as a simple
    // entity, passing the callback function.
    if (typeof entDefObj === "string") {
      return this.insertOrFind({metaType: 's', title: entDefObj}, callback);
    }

    // Else, modify the callback, first of all, such that it also up-rates
    // the properties of entDefObj.otherProps for the entity once its ID is
    // gotten.
    let modCallback = (entID) => {
      // First call the original callback function.
      callback(entID);

      // Then up-rate the 'other properties' found in entDefObj.otherProps.
      
      // TODO: Implement.
    };

    // Else check the meta type of the entDefObj, and branch accordingly.
    switch (entDefObj.metaType) {
      case 'd':

        break;
      
      case 's':
        let title = entDefObj.title;
        if (title[0] === "@") {
          // If entDefObj.title is a key, wait for it to resolve, then call
          // the modified callback function.
          this.#waitForIDThen(title, modCallback);
        } else {
          // If entDefObj.title is a title, potentially convert a leading '\@'
          // to '@'.
          let conTitle = (entDefObj.substring(0, 2) === "\\@") ?
            entDefObj.substring(1) :
            entDefObj;
          
          // Also check if the converted title is not too long.
          let titleLen = (new TextEncoder().encode(conTitle)).length;
          if (titleLen > 255) {
            throw (
              'EntityInserter: String "' + conTitle + "' has UTF-8 length " +
              titleLen + " > 255."
            );
          }

          // Then construct an input request with the unconverted
          // title as the key. If #inputOrLookupEntity() has been called before
          // with the same key, it will not send another request put just
          // pass the callback function to wait the the entID to be resolved.
          let accountManager = this.accountManager;
          let reqData = {
            req: "sim",
            ses: accountManager.sesIDHex,
            u: accountManager.inputUserID,
            r: 1,
            t: conTitle,
          }
          this.#inputOrLookupEntity(reqData, title, modCallback)
        }
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



  // #waitForIDThen() executes the callback function as soon as the entID
  // referred to by the key is ready.
  #waitForIDThen(key, callback) {
    let idOrCallbackArr = this.#idOrCallbackArrStore[key];
    
    // If idOrCallbackArr is an array (of callbacks), simply append callback.
    if (typeof idOrCallbackArr === "object") {
      idOrCallbackArr.push(callback);
      return;
    }

    // Else if idOrCallbackArr is undefined, create a new callback array
    if (idOrCallbackArr === undefined) {
      this.#idOrCallbackArrStore[key] = [callback];
      return;
    }
    
    // Else idOrCallbackArr is already the ID rather than an array, so simply
    // call the callback function immediately.
    callback(idOrCallbackArr);
    return;
  }

  // #storeIDAndResolve() stores a freshly fetched entID and then resolves all
  // the waiting callback functions.  
  #storeIDAndResolve(key, entID) {
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
  
  // #inputOrLookupEntity() forwards an input request to the server, but
  // only if the key is not already stored in idOrCallbackArrStore, either
  // pending or resolved. If key is falsy, then the request is always sent.
  // The supplied callback function is called as soon as the ID is ready (which
  // might be immediately).
  #inputOrLookupEntity(reqData, key, callback) {
    if (key) {
      let entID = this.#idOrCallbackArrStore[key];
      if (entID !== undefined && typeof entID !== "object") {
        callback(entID);
      } else {
        this.#waitForIDThen(key, callback);
        DBRequestManager.input(reqData, (result) => {
          this.#storeIDAndResolve(key, result.outID);
        });
      }
    } else {
      DBRequestManager.input(reqData, (result) => {
        callback(result.outID);
      });
    }
  }

}
