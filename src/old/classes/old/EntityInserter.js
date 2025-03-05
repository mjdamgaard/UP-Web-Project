
import {DBRequestManager} from "../DBRequestManager.js";


export const SIMPLE_TAG_CLASS_ID = "2";
export const SIMPLE_ENTITY_CLASS_ID = "3";
export const SIMPLE_PROPERTY_CLASS_ID = "4";
export const PROPERTY_TAG_CLASS_ID = "5";
export const LIST_CLASS_ID = "7";
export const RELEVANT_PROPERTIES_TAG_CLASS_ID = "9";
export const ENTITIES_CATEGORY_ID = "10";




export class EntityInserter {

  constructor(accountManager, parentInserter) {
    // Public properties:
    this.accountManager = accountManager;
    this.parentInserter = parentInserter;
    this.entKeyIDStore = {};
  }


  insertEntities(entArr, callback) {
    const defStrCompOrOtherRegex =
        /[^\\@]+|\\.|@[1-9][0-9]*|@"([^"\\]|\\.)*"|.+/g;
    const defStrCompRegex =
      /^([^\\@]+|\\.|@[1-9][0-9]*|@"([^"\\]|\\.)*")$/g;
    const entKeyRefRegex =
                                /^@"([^"\\]|\\.)*"$/g;
    // Construct an array of {entKey, defStrComponents, dependencies} for all
    // entities ({entKey, entDef}) in entArr.
    const parsedEntArr = entArr.map(ent => {
      const {entKey, entDef} = ent;
      const defStrComponents = entDef.match(defStrCompOrOtherRegex);
      // Check that all components matches a valid strCompRegex.
      const lastComp = defStrComponents[defStrComponents.length - 1];
      if (!defStrCompRegex.test(lastComp)) {
        debugger;throw (
          "EntityInserter: ill-formed def from: '" + lastComp + "'"
        );
      }
      // Then find all the dependencies (entKeys).
      const dependencies = defStrComponents
        .filter(str => entKeyRefRegex.test(entKeyRefRegex))
        .map(entKeyRef => entKeyRef.slice(2, -1));
      // And finally return {entKey, defStrComponents, dependencies,
      // isInserted}
      return {
        entKey: entKey,
        defStrComponents: defStrComponents,
        dependencies: dependencies,
        isInserted: false,
        hasReturned: false,
      };
    });

    // Now we simply loop through each one, and inserts it only if its
    // dependencies all exist in entKeyIDStore. Whenever a matching ID is
    // found in that store, we remove the dependency so that we don't have to
    // check it several times. Then whenever an insertion returns an outID for
    // an entity with an entKey, we loop through all parsedEntArr again and
    // remove the dependencies of the given entKey. And whenever this leaves
    // a parsedEnt with no dependencies left, we also insert it.
    parsedEntArr.forEach(parsedEnt => {
      parsedEnt.dependencies = parsedEnt.dependencies
        .filter(entKey => this.getID(entKey));
      if (parsedEnt.dependencies.length === 0) {
        this.#insertParsedEntity(parsedEnt, parsedEntArr, callback);
      }
    });
  }


  #insertParsedEntity(parsedEnt, parsedEntArr, finalCallback) {
    parsedEnt.isInserted = true;
    const entKeyRefRegex = /^@"([^"\\]|\\.)*"$/g;
    const subbedComponents = parsedEnt.defStrComponents.map(comp => {
      if (entKeyRefRegex.test(comp)) {
        let entKey = comp.slice(2, -1);
        let entID = this.getIDOrThrow(entKey);
        return "@" + entID;
      }
      else {
        return comp;
      }
    });
    const entDef = subbedComponents.join();
    this.#insertEntity(entDef, parsedEnt.entKey, () => {
      // After the insertion, first set hasReturned, and if all inserts has
      // returned, call the final callback. 
      parsedEnt.hasReturned = true;
      let isDone = parsedEntArr.reduce(
        (acc, val) => acc && val.hasReturned,
        true
      );
      if (isDone) {
        finalCallback();
        return;
      }
      // Else remove all dependencies === entKey from parsedEntArr, and if
      // this removes a last dependency, insert the given parsedEnt.
      let entKey = parsedEnt.entKey;
      parsedEntArr.forEach(val => {
        if (val.isInserted) {
          return;
        }
        val.dependencies = val.dependencies
          .filter(dependency => (dependency !== entKey));
        if (val.dependencies.length === 0) {
          this.#insertParsedEntity(val, parsedEntArr, finalCallback)
        }
      });
    });
  }



  #insertEntity(entDef, entKey, callback) {
    callback ??= (entID, entKey) => {};

    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      d: entDef.parentID,
    };
    DBRequestManager.input(reqData, (result) => {
      if (entKey) {
        if (this.entKeyIDStore[entKey]) {
          debugger;throw (
            "EntityInserter: entKey is already used: '" + entKey + "'"
          );
        }
        this.entKeyIDStore[entKey] = result.outID;
      }
      callback(result.outID, entKey);
    });
  }




  getIDOrThrow(entKey) {
    let id = this.entKeyIDStore[entKey];
    if (id) {
      return id;
    }
    else {
      if (this.parentInserter) {
        return this.parentInserter.getIDOrThrow(entKey);
      }
      else throw "EntityInserter: missing key: " + entKey;
    }
  }


  getID(entKey) {
    let id = this.entKeyIDStore[entKey];
    if (id) {
      return id;
    }
    else {
      if (this.parentInserter) {
        return this.parentInserter.getID(entKey);
      }
      else return false;
    }
  }












  #insertRatings(entDefObj) {
    let ratingArr = entDefObj.ratings;
    ratingArr.forEach(val => {
      let tag = val.tag;
      let instRatingArr = val.instances;
      this.insertOrFind(tag, (tagID) => {
        instRatingArr.forEach(val => {
          let [inst, rating] = val;
          this.insertOrFind(inst, (instID) => {
            this.#insertRating(tagID, instID, rating);
          });
        });
      });
    });
  }




  #insertRating(tagID, instID, rating) {
    var roundedRatVal;
    if (rating === "del" || rating === "delete") {
      roundedRatVal = 0;
    } else {
      rating = parseFloat(rating);
      if (isNaN(rating) || rating < 0 || 10 < rating) {
        throw (
          'EntityInserter: A rating of ' + rating + ' is not valid.'
        );
      }
      roundedRatVal = Math.max(Math.round(rating * 25.5), 1) * 256;
      if (roundedRatVal == 0) {
        roundedRatVal = roundedRatVal + 1;
      }
    }
    let reqData = {
      req: "rat",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      t: tagID,
      i: instID,
      r: roundedRatVal,
      l: 0,
    };
    DBRequestManager.input(reqData);
  }


}
