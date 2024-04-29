
import {DBRequestManager} from "../classes/DBRequestManager.js";




export class EntityInserter {
  #idOrCallbackArrStore = {};

  constructor(accountManager) {
    // Public properties:
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
      callback = (entID) => {};
    }
    // If entDefObj is falsy, call the callback function on null and return.
    if (!entDefObj) {
      callback(null);
      return;
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

    // If entDefObj is a string, it can either start with "@" and be an entity
    // or a key reference, or it can be a simple entity, denoted by its title,
    // except that if the title starts with '@', this has to be escaped as
    // '\@' instead (but this only applies at the beginning of the title.)
    if (typeof entDefObj === "string") {
      // If entDefObj is neither an entity reference nor a key reference, pass
      // it on to be handled by #insertOrFindSimpleEntity().
      if (entDefObj[0] !== "@") {
        // Note that any leading '\@' will be converted to '@' by
        // #insertOrFindSimpleEntity().
        this.insertOrFind({dataType: 'sim', title: entDefObj}, callback);
        return;
      }

      // If title is an entity reference, simply call the callback function
      // immediately and return. 
      if (/^@[1-9]/.test(entDefObj)) {
        // Throw if the entity reference is ill-formed.
        if (!/^@[1-9][0-9]*\.$/.test(entDefObj)) {
          throw (
            'EntityInserter: "' + entDefObj + '" is not a valid entity ' +
            'reference.'
          );
        }
        // Else call the callback and return.
        let entID = entDefObj.slice(1, -1);
        callback(entID);
        return;
      }
  
      // Else if entDefObj is a key, wait for it to resolve, then call the
      // callback function. But throw if the key reference is ill-formed.
      if (!/^@[a-zA-Z][\w_]*\.$/.test(entDefObj)) {
        throw (
          'EntityInserter: "' + entDefObj + '" is not a valid key reference.'
        );
      }
      // Else call the callback after the key has resolved.
      this.#waitForIDThen(entDefObj, callback);
      return;
    }

    // Else, modify the callback, first of all, such that it also up-rates
    // the properties of entDefObj.otherProps for the entity once its ID is
    // gotten, if entDefObj.otherProps is not undefined (or falsy).
    let modCallback = (entID) => {
      // First call the original callback function.
      callback(entID);
      // Then up-rate the 'other properties' found in entDefObj.otherProps.
      if (entDefObj.otherProps) {
        this.insertOrFind(entDefObj.otherProps, (propDocID) => {
          this.#uprateProperties(entID, propDocID);
        });
      }
      // Then up-rate this entity for the tags found in entDefObj.fittingTags.
      if (entDefObj.fittingTags) {
        entDefObj.fittingTags.forEach(val => {
          let [tag, rating] = val;
          this.insertOrFind(tag, (tagID) => {
            this.#insertRating(tagID, entID, rating);
          });
        });
      }
    };

    // We also get the entity key property if any.
    let key = entDefObj.key;

    // Then check the data type of the entDefObj, and branch accordingly.
    switch (entDefObj.dataType) {      
      case 'sim':
        // (For simple entities, the title is always the key reference.)
        this.#insertOrFindSimpleEntity(entDefObj, modCallback);
        break;
      case 'assoc':
        this.#insertOrFindAssocEntity(entDefObj, key, modCallback);
      case 'formal':
        this.#insertOrFindFormalEntity(entDefObj, key, modCallback);
        break;
      case 'propTag':
        this.#insertOrFindPropertyTagEntity(entDefObj, key, modCallback);
        break;
      case 'stmt':
        this.#insertOrFindStatementEntity(entDefObj, key, modCallback);
        break;
      case 'list':
        this.#insertOrFindListEntity(entDefObj, key, modCallback);
        break;
      case 'propDoc':
        this.#insertOrFindPropDocEntity(entDefObj, key, modCallback);
        break;
      case 'text':
        this.#insertOrFindTextEntity(entDefObj, key, modCallback);
        break;
      case 'binary':
        throw "EntityInserter: Binaries are not implemented yet.";
      case 'user':
        throw "EntityInserter: Users cannot be inserted.";
      case 'bot':
        throw "EntityInserter: Aggregation bots cannot be inserted.";
      /* Virtual data types used just for this method */
      case 'ratings':
        this.#insertRatings(entDefObj);
        break;
      case 'none':
        // Simply call modCallback on null.
        modCallback(null);
        break;
      default:
        throw "EntityInserter: Unrecognized data type.";
    }
    return;
  }



  #insertOrFindSimpleEntity(entDefObj, modCallback) {
    let title = entDefObj.title ?? entDefObj.titleArr.join("");

    // If title is an entity reference, simply call the modified callback
    // immediately and return. 
    if (/^@[1-9]/.test(title)) {
      // Throw if the entity reference is ill-formed.
      if (!/^@[1-9][0-9]*\.$/.test(title)) {
        throw (
          'EntityInserter: "' + title + '" is not a valid entity reference.'
        );
      }
      // Else call the modCallback and return.
      let entID = title.slice(1, -1);
      modCallback(entID);
      return;
    }

    // If title is a key, wait for it to resolve, then call the modified
    // callback function.
    if (title[0] === "@") {
      // Throw if the key reference is ill-formed.
      if (!/^@[a-zA-Z][\w_]*\.$/.test(title)) {
        throw (
          'EntityInserter: "' + title + '" is not a valid key reference.'
        );
      }
      // Else call the modCallback after the key has resolved.
      this.#waitForIDThen(title, modCallback);
      return;
    }

    // If title is a title, potentially convert a leading '\@' to '@'.
    let actualTitle = (title.substring(0, 2) === "\\@") ?
      title.substring(1) :
      title;
    
    // Also check if the converted title is not too long.
    let titleLen = (new TextEncoder().encode(actualTitle)).length;
    if (titleLen > 255) {
      throw (
        'EntityInserter: String "' + actualTitle + '" has UTF-8 length ' +
        titleLen + ' > 255.'
      );
    }

    // Then construct an input request with the unconverted
    // title as the key. If #inputOrLookupEntity() has been called before
    // with the same key, it will not send another request put just
    // pass the callback function to wait the the entID to be resolved.
    let reqData = {
      req: "sim",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      t: actualTitle,
    };
    this.#inputOrLookupEntity(reqData, title, modCallback);
    return;
  }




  #insertOrFindAssocEntity(entDefObj, key, modCallback) {
    let title = entDefObj.title ?? entDefObj.titleArr.join("");
    let propDoc = entDefObj.propDoc;

    // We insert the property document, and give it a callback to insert
    // or find the title, after which we finally call #inputOrLookupEntity()
    // for this 'associative' entity.
    this.insertOrFind(propDoc, (propDocID) => {
      this.insertOrFind(title, (titleID) => {
        let reqData = {
          req: "assoc",
          ses: this.accountManager.sesIDHex,
          u: this.accountManager.inputUserID,
          t: titleID,
          p: propDocID,
        };
        this.#inputOrLookupEntity(reqData, key, (entID) => {
          // Call the callback, and also uprate the properties contained
          // in the defining property document.
          modCallback(entID);
          this.#uprateProperties(entID, propDocID);
        });
      });
    });
  }


  #insertOrFindFormalEntity(entDefObj, key, modCallback) {
    let fun = entDefObj.function;
    let inputList = entDefObj.inputs;

    // We insert or find the function, with a callback to then insert the
    // input list as well, with yet another callback to finally insert the
    // 'formal' entity once the funID and inputListID are resolved.
    // (Note that dding a key to functions speeds up the insertion process.)
    this.insertOrFind(fun, (funID) => {
      this.insertOrFind(inputList, (inputListID) => {
        let reqData = {
          req: "form",
          ses: this.accountManager.sesIDHex,
          u: this.accountManager.inputUserID,
          f: funID,
          i: inputListID,
        };
        this.#inputOrLookupEntity(reqData, key, modCallback);
      });
    });
  }


  #insertOrFindPropertyTagEntity(entDefObj, key, modCallback) {
    let subj = entDefObj.subject;
    let prop = entDefObj.property;

    // We insert or find the subject, with a callback to then insert the
    // property as well, with yet another callback to finally insert the
    // 'property tag' entity once the subjID and propID are resolved.
    // (Note that using simple entities as properties (often advised), or
    // adding a key to non-simple properties speeds up the insertion process.)
    this.insertOrFind(subj, (subjID) => {
      this.insertOrFind(prop, (propID) => {
        let reqData = {
          req: "propTag",
          ses: this.accountManager.sesIDHex,
          u: this.accountManager.inputUserID,
          s: subjID,
          p: propID,
        };
        this.#inputOrLookupEntity(reqData, key, modCallback);
      });
    });
  }


  #insertOrFindStatementEntity(entDefObj, key, modCallback) {
    let tag = entDefObj.tag;
    let inst = entDefObj.instance;

    // This method follows a similar procedure as the one above for property
    // tags.
    this.insertOrFind(tag, (tagID) => {
      this.insertOrFind(inst, (instID) => {
        let reqData = {
          req: "stmt",
          ses: this.accountManager.sesIDHex,
          u: this.accountManager.inputUserID,
          t: tagID,
          i: instID,
        };
        this.#inputOrLookupEntity(reqData, key, modCallback);
      });
    });
  }





  #insertOrFindListEntity(entDefObj, key, modCallback) {
    let elemArr = entDefObj.elements;
    this.#mapInsert(elemArr, val => val, idArr => {
      let listText = idArr.join(",");
      if (listText.length) {
        throw (
          'EntityInserter: List "' + listText + '" is too long (' +
          listText.length + ' > 65535).'
        );
      }
      let reqData = {
        req: "list",
        ses: this.accountManager.sesIDHex,
        u: this.accountManager.inputUserID,
        l: listText,
      };
      this.#inputOrLookupEntity(reqData, key, modCallback);
    });
    return;
  }


  #insertOrFindPropDocEntity(entDefObj, key, modCallback) {
    let propAndValuesArr = entDefObj.properties;
    // Insert or find all the property entities.
    this.#mapInsert(propAndValuesArr, val => val.property, propIDArr => {
      // Insert or find all the value entities.
      this.#mapInsert(propAndValuesArr, val => val.valueList, valListIDArr => {
        // Insert or find all the value list entities.
        this.#mapInsert(propAndValuesArr, val => val.value, valIDArr => {
          // Construct the propDocText.
          let propDoc = propIDArr
            .map((propID, ind) => {
              let val = valIDArr[ind];
              if (val) {
                return (propID + "=" + val + ";");
              } else {
                return (propID + ":" + valListIDArr[ind] + ";");
              }
            })
            .join("");
          // Then verify its length, and insert it if verification succeeds.
          if (propDoc.length) {
            throw (
              'EntityInserter: Property document "' + propDoc + '" is too ' +
              'long (' + propDoc.length + ' > 65535).'
            );
          }
          let reqData = {
            req: "propDoc",
            ses: this.accountManager.sesIDHex,
            u: this.accountManager.inputUserID,
            p: propDoc,
          };
          this.#inputOrLookupEntity(reqData, key, modCallback);
        });
      });
    });
    return;
  }




  // #mapInsert() takes and array and getEntDefObj function, which extracts
  // an entDefObj from each element of the array. It then calls insertOrFind()
  // for each of these extracted objects. And once all these are resolved and
  // the outID is obtained from each one, the third input, callback, is called
  // on an array containing all these IDs, and having the same order as the
  // input array.
  // (Note that getEntDefObj can be a pure function, but it can also be a
  // function that stores some data about the element in an auxillary data
  // structure (e.g. an array) about the element, which can then be used by
  // the callback to know how to do with the resulting idArr.)
  #mapInsert(array, getEntDefObj, callback) {
    if (callback === undefined) {
      callback = getEntDefObj;
      getEntDefObj = (val, ind, arr) => val;
    }
    let entDefObjArr = array.map(getEntDefObj);
    let len = entDefObjArr.length;
    var IndexIDPairArr = [];
    // Prepare a function to end this method once IndexIDPairArr is grown to
    // its full length.
    let ifReadyGetIDArrThenCallback = () => {
      if (IndexIDPairArr.length === len) {
        // Sort the IndexIDPairArr such that the indexes are in ascending,
        // order, then extract an array of IDs in that order.
        let idArr = IndexIDPairArr
          .sort((a, b) => a[0] - b[0])
          .map(val => val[1]);
        // Finally call the provided callback.
        callback(idArr);
      }
    }
    // Then call insertOrFind() on each nested entDefObj, giving each one
    // a callback to push the index-ID pair to IndexIDPairArr, then call
    // ifReadyGetIDArrThenCallback().
    entDefObjArr.forEach((val, ind) => {
      this.insertOrFind(val, (entID) => {
        IndexIDPairArr.push([ind, entID]);
        ifReadyGetIDArrThenCallback();
      });
    });
    return;
  }

  // #mapQuery() query is like #mapInsert but where the array contains query
  // reqData instead of entDef objects, and where the callback is called on an
  // array of query results rather than an array of outID's.
  #mapQuery(array, getReqData, callback) {
    if (callback === undefined) {
      callback = getReqData;
      getReqData = val => val;
    }
    let reqDataArr = array.map(getReqData);
    let len = reqDataArr.length;
    var IndexResultPairArr = [];
    // Prepare a function to end this method once IndexResultPairArr is grown
    // to its full length.
    let ifReadyGetResultArrThenCallback = () => {
      if (IndexResultPairArr.length === len) {
        // Sort the IndexResultPairArr such that the indexes are in ascending,
        // order, then extract an array of IDs in that order.
        let resultArr = IndexResultPairArr
          .sort((a, b) => a[0] - b[0])
          .map(val => val[1]);
        // Finally call the provided callback.
        callback(resultArr);
      }
    }
    // Then call query the database with each nested reqData, giving each one
    // a callback to push the index-result pair to IndexResultPairArr, then
    // call ifReadyGetResultArrThenCallback().
    reqDataArr.forEach((reqData, ind) => {
      DBRequestManager.query(reqData, (result) => {
        IndexResultPairArr.push([ind, result]);
        ifReadyGetResultArrThenCallback();
      });
    });
    return;
  }





  #insertOrFindTextEntity(entDefObj, key, modCallback) {
    let text = entDefObj.text ?? entDefObj.textArr.join("");
    this.getSubstitutedText(text, (newText) => {
      let reqData = {
        req: "text",
        ses: this.accountManager.sesIDHex,
        u: this.accountManager.inputUserID,
        t: newText,
      };
      this.#inputOrLookupEntity(reqData, key, modCallback);
    });

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




  // getSubstitutedText() takes a text containing key references of the form
  // /@[a-zA-Z][\w_]*\./ and substitutes these with entity references of the
  // form /@[1-9][0-9]*\./, by looking up the entity IDs via calls to the
  // #waitForIDThen() method. getSubstitutedText() then finally calls the
  // supplied callback function on the converted text.
  getSubstitutedText(text, callback) {
    // If there are no key references (left) in the text, convert all
    // occurrences of '\@' to '@', and '\\' to '\', and verify that there are
    // no ill-formed references, then call the callback function and return;
    let firstKeyReference = (text.match(/@[a-zA-Z][\w_]*\./g) ?? [])[0];
    if (!firstKeyReference) {
      let transformedText = text
        .replaceAll("\\\\", "\\\\0")
        .replaceAll("\\@", "\\\\1");
      let containsIllFormedRefs = (
        transformedText.match(/@/g).length !==
        transformedText.match(/@[1-9][0-9]*\./g).length
      );
      if (containsIllFormedRefs) {
        throw (
          'EntityInserter: Text "' + text + '" contains ill-formed references.'
        );
      }
      // If this test succeeds, call the callback function on the (final) text.
      callback(text);
      return;
    }

    // Else wait for the ID of the first key reference, then call this method
    // again recursively on the text with this first key reference substituted.
    this.#waitForIDThen(firstKeyReference, (entID) => {
      let newText = text.replace(firstKeyReference, "@" + entID + ".");
      this.getSubstitutedText(newText, callback);
    });
    return;
  }


  // #uprateProperties() takes the ID of a subject entity and a property
  // document entity, quires for the property document text, and then up-rates
  // all the properties of this document for the given subject entity.
  #uprateProperties(subjID, propDocID) {
    let reqData = {
      req: "propDoc",
      id: propDocID,
      l: 0,
      s: 0,
    };
    DBRequestManager.query(reqData, (result) => {
      let propDoc = result[0][0];

      // Extract a property--value pair array for all single-value properties,
      // and a property--list pair array for all multiple-values properties.
      let propValPairs = (propDoc.match(/[1-9][0-9]*=[1-9][0-9]*;/g) ?? [])
        .map(elem => elem.slice(0, -1).split("="));
      let propListPairs = (propDoc.match(/[1-9][0-9]*:[1-9][0-9]*;/g) ?? [])
        .map(elem => elem.slice(0, -1).split(":"));

      // For each property--value pair, insert or find the propTag, then insert
      // a maximal rating that the subject fits that tag.
      propValPairs.forEach(elem => {
        let propID = elem[0];
        let valID = elem[1];
        let propTag = {
          dataType: "propTag",
          subject: "@" + subjID + ";",
          property: "@" + propID + ";",
        };
        this.insertOrFind(propTag, (propTagID) => {
          this.#insertRating(propTagID, valID, 256);
        });
      });
      // For each property--list pair, insert or find the propTag, then query
      // for the listText, and for each element of that list, insert a maximal
      // rating.
      propValPairs.forEach(elem => {
        let propID = elem[0];
        let listID = elem[1];
        let propTag = {
          dataType: "propTag",
          subject: "@" + subjID + ";",
          property: "@" + propID + ";",
        };
        this.insertOrFind(propTag, (propTagID) => {
          let reqData = {
            req: "list",
            id: listID,
            l: 0,
            s: 0,
          };
          DBRequestManager.query(reqData, (result) => {
            let listText = result[0][0];
            let valIDArr = listText.split(",");
            valIDArr.forEach(valID => {
              this.#insertRating(propTagID, valID, 256);
            });
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



  // #waitForIDThen() executes the callback function as soon as the entID
  // referred to by the key is ready.
  #waitForIDThen(key, callback) {
    let idOrCallbackArr = this.#idOrCallbackArrStore[key];
    
    // If idOrCallbackArr is an array (of callbacks), simply append callback.
    if (Array.isArray(idOrCallbackArr)) {
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
    let entID = idOrCallbackArr;
    callback(entID);
    return;
  }

  // #storeIDAndResolve() stores a freshly fetched entID and then resolves all
  // the waiting callback functions.  
  #storeIDAndResolve(key, entID) {
    let callbackArr = this.#idOrCallbackArrStore[key] ?? [];

    // Verify that the callback array is not already replaced with an ID by
    // an earlier call to this method.
    if (!Array.isArray(callbackArr)) {
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
      if (entID && typeof entID !== "object") {
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
    return;
  }

}
