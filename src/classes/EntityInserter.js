
import {DBRequestManager} from "../classes/DBRequestManager.js";




export class EntityInserter {
  #entKeyIDStore = {
    // s: {}, // The 's' prefix stands for string/simple entities.
    // p: {}, // The 's' prefix stands for property entities.
    // o: {}, // The 's' prefix stands for other/object entities.
  };

  constructor(accountManager) {
    // Public properties:
    this.accountManager = accountManager;
  }

  #getIDOrThrow(entKey) {
    let id = this.#entKeyIDStore[entKey];
    if (typeof id !== "string") {
      throw "EntityInserter: missing key: " + entKey;
    }
    return id;
  }
  
  #insertOrLookupEntity(reqData, entKey, callback) {
    if (entKey) {
      let entID = this.#entKeyIDStore[entKey];
      if (entID && typeof entID !== "object") {
        callback(entID);
      } else {
        this.#waitForIDThen(entKey, callback);
        DBRequestManager.input(reqData, (result) => {
          this.#storeIDAndResolve(entKey, result.outID);
        });
      }
    } else {
      DBRequestManager.input(reqData, (result) => {
        callback(result.outID);
      });
    }
    return;
  }



  // substitutePropsAndValues(props) substitute all occurrences of "@[^0-9]..."
  // in props, both for it value and its keys. 
  substitutePropKeysAndValues(props) {
    let entKeyRegEx = /^@[^0-9]/g;
    props.keys().forEach(prop => {
      // Substitute property if it is a key reference.
      if (entKeyRegEx.test(prop)) {
        let idRef = "@" + this.#getIDOrThrow(prop);
        props[idRef] = props[prop];
        delete props[prop];
        prop = idRef;
      }

      // Substitute property value if it is a key reference.
      let val = props[prop];
      if (entKeyRegEx.test(val)) {
        let idRef = "@" + this.#getIDOrThrow(val);
        props[prop] = idRef;
      }

      // If val is an object, including an array, call this method on each
      // value/element.
      if (val && typeof val === "object") {
        val.keys().forEach(elem => {
          this.substitutePropKeysAndValues(elem);
        });
      }
    });
  }

  // substitutePropsAndFillOut(props) takes an entDef and calls
  // substitutePropsAndValues() on entDef.props and also initializes parentID,
  // spec, props, and data if they are undefined.
  substitutePropsAndFillOut(entDef) {
    entDef.parentID ??= 0;
    entDef.spec ??= "";
    entDef.props ??= "";
    entDef.data ??= "";
    if (!entDef.props) {
      this.substitutePropKeysAndValues(entDef.props);
    }
  }

  // insertOrFindEntityOnly() uploads an entity defined by entDef, stores the
  // outID for the entKey, if any, and calls the callback.
  insertOrFindEntityOnly(entDef, entKey, callback) {
    callback ??= (entID) => {};
    if (this.#entKeyIDStore[entKey]) {
      throw "EntityInserter: entKey " + entKey + " is already in use";
    }
    this.substitutePropsAndFillOut(entDef)
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: entDef.parentID,
      s: entDef.spec,
      ps: entDef.props,
      d: entDef.data,
    };
    DBRequestManager.input(reqData, (result) => {
      // Note that entKeys starting with [0-9] is no use.
      if (typeof entKey === "string") {
        this.#entKeyIDStore[entKey] = result.outID;
      }
      callback(result.outID);
    });
  }
  


  // insertPropKeys() can be called after substitutePropKeysAndValues()
  // in order to also insert all the string-valued properties.
  insertPropKeys(props, callback) {
    var propKeys = props.keys();
    var ind = 0;
    this.#insertPropKeysHelper(propKeys, ind, props, callback)
  }

  #insertPropKeysHelper(propKeys, ind, callback) {
    let propKey = propKeys[ind];
    // If end of propKeys is reached, call the callback and return.
    if (!propKey) {
      return callback();
    }
    // If propKey is an ID (or entKey) reference, skip it.
    if (!/^[^@]/.test(propKey)) {
      this.#insertPropKeysHelper(propKeys, ind + 1, callback);
    }
    // Skip also if the prop is already inserted and stored.
    if (this.#entKeyIDStore["@p." + propKey]) {
      this.#insertPropKeysHelper(propKeys, ind + 1, callback);
    }

    // Else insert it as a property entity (parentID = 4) and continue. But not
    // before removing any leading '\' (which can escape '@').
    if (propKey[0] === "\\") {
      propKey = propKey.slice(1);
    }
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: "4",
      s: propKey,
      ps: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.#entKeyIDStore["@p." + propKey] = result.outID;
      this.#insertPropKeysHelper(propKeys, ind + 1, callback);
    });
  }


  // insertPropValues() can be called after substitutePropKeysAndValues()
  // in order to also insert all the string-valued property values.
  // The depth specifies how deep into arrays the function should go, default
  // value being 1, meaning that all set elements are inserted, but list
  // elements are not (and lists themselves are never inserted by this method).
  insertPropValues(props, depth, callback) {
    if (!callback) {
      callback = depth;
      depth = 1;
    }
    var propKeys = props.keys();
    var ind = 0;
    this.#insertPropValuesHelper(propKeys, ind, props, depth, callback)
  }

  #insertPropValuesHelper(propKeys, ind, props, callback) {
    let propKey = propKeys[ind];
    // If end of propKeys is reached, call the callback and return.
    if (!propKey) {
      callback();
      return;
    }
    let val = props[propKey];
    // If val is an ID (or entKey) reference, skip it.
    if (!/^[^@]/.test(val)) {
      this.#insertPropValuesHelper(propKeys, ind + 1, props, depth, callback);
    }
    // Skip also if val is already inserted and stored.
    if (this.#entKeyIDStore["@s." + val]) {
      this.#insertPropValuesHelper(propKeys, ind + 1, props, depth, callback);
    }


    // If val is an array and depth > 0, call insertPropValues() on each
    // element, subtracting 1 from depth, then continue.
    if (Array.isArray(val) && depth > 0) {
      this.insertPropValues(val, depth - 1, () => {
        this.#insertPropValuesHelper(propKeys, ind + 1, props, depth, callback);
      });
      return;
    }

    // Else insert it as a simple entity (parentID = 3) and continue. But not
    // before removing any leading '\' (which can escape '@').
    if (propKey[0] === "\\") {
      propKey = propKey.slice(1);
    }
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: "3",
      s: propKey,
      ps: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.#entKeyIDStore["@s." + propKey] = result.outID;
      this.#insertPropValuesHelper(propKeys, ind + 1, props, depth, callback);
    });
  }


  // // insertProps() combines the last two methods into one.
  // insertProps(props, callback) {
  //   this.insertPropKeys(props, () => {
  //     this.insertPropValues(props, () => {
  //       callback();
  //     });
  //   });
  // }



  // insertPropsAndPropTags() first calls insertPropKeys to insert all property
  // key strings, then go through each property key and inserts a
  // propTag for one with entID as the subject.
  // Note that substitutePropKeysAndValues() ought to be called somehow before
  // this method.
  insertPropKeysAndPropTags(entID, props, callback) {
    var propKeys = props.keys();
    var ind = 0;
    this.insertPropKeys(props, () => {
      this.#insertPropKeysAndPropTagsHelper(propKeys, ind, entID, callback);
    });
  }

  #insertPropKeysAndPropTagsHelper(propKeys, ind, entID, callback) {
    let propKey = propKeys[ind];
    // If end of propKeys is reach, call the callback and return.
    if (!propKey) {
      callback();
      return;
    }

    // Get the propID.
    var propID;
    // If propKey is an ID reference, get that.
    if (/^@[1-9][0-9]*$/.test(propKey)) {
      propID = propKey.slice(1);
    }
    // // If propKey is an entKey reference, get the ID (or throw).
    // else if (/^@[^0-9]/.test(propKey)) {
    //   propID = this.#getIDOrThrow(propKey);
    // }
    // Else if propKey is a string, get the ID from the @p.<string> entKey.
    else {
      propID = this.#getIDOrThrow("@p." + propKey);
    }

    // Construct the propTag entKey.
    let propTagEntKey = "@pt." + entID + "." + propID;


    // Skip this propTag if it is already inserted and stored.
    if (this.#entKeyIDStore[propTagEntKey]) {
      this.#insertPropKeysAndPropTagsHelper(propKeys, ind + 1, entID, callback);
    }

    // Else insert it as the propTag entity (parentID = 5) and continue.
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: "5",
      s: entID + "|" + propID,
      ps: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.#entKeyIDStore[propTagEntKey] = result.outID;
      this.#insertPropKeysAndPropTagsHelper(propKeys, ind + 1, entID, callback);
    });
  }



  // insertAndUprateProps() first calls substitutePropKeysAndValues(), 
  // insertPropKeysAndPropTags() and insertPropValues(), then go through each
  // property and up-rates all values with a maximum depth of 1, meaning that
  // string-valued and entID-valued properties (including substituted entKeys)
  // get up-rated, as well as such values inside a set. But anonymous lists
  // don't get uprated (nor do their elements get inserted).
  insertAndUprateProps(entID, props, callback) {
    this.substitutePropKeysAndValues(props);
    this.insertPropKeysAndPropTags(entID, props, () => {
      this.insertPropValues(props, () => {
        // After having substituted entKeys in props, then inserted property
        // keys, property tags, and values, go through each property key,
        // get the given property tag, and get an array of all values to uprate
        // for that propTag.
        props.keys().forEach(propKey => {
          var propID;
          // If propKey is an ID reference, get that.
          if (/^@[1-9][0-9]*$/.test(propKey)) {
            propID = propKey.slice(1);
          }
          // Or if propKey is a string, get the ID from the @p.<string> entKey.
          else {
            propID = this.#getIDOrThrow("@p." + propKey);
          }
          // Get the stored propTag ID.
          let propTagID = this.#getIDOrThrow("@pt." + entID + "." + propID);
          
          // Get all non-list values.
          let valSet = props[propKey];
          var valArr = Array.isArray(valSet) ? valSet : [valSet];
          valArr.forEach(val => {
            if (typeof val !== "string") {
              return;
            }
            var valID;
            // If val is an ID reference, get that.
            if (/^@[1-9][0-9]*$/.test(val)) {
              valID = val.slice(1);
            }
            // Or if val is a string, get the ID from the @s.<string> entKey.
            else {
              valID = this.#getIDOrThrow("@s." + val);
            }

            // Now send a request to uprate this valID for the given propTagID.
            let reqData = {
              req: "rat",
              ses: this.accountManager.sesIDHex,
              u: this.accountManager.inputUserID,
              t: propTagID,
              i: valID,
              r: "255",
            };
            DBRequestManager.input(reqData, (result) => {
              console.log(
                "rating input outID: " + result.outID + ", and exitCode: " +
                result.exitCode
              );
            });
          });

        });
        callback();
      });
    });
  }



  // insertOrFindEntityThenInsertAndUprateProps() inserts an entity defined by
  // entDef, stores it outID with the entKey in the #entKeyIDStore, then
  // inserts properties and values from entDef.props, if any, and up-rates
  // all these property values, unless they are lists (nested arrays). If
  // a value in props is an array (not nested), then it is interpreted as a
  // set of property values, and each is inserted and up-rated individually
  // (but again, not if they are lists)
  insertOrFindEntityThenInsertAndUprateProps(entDef, entKey, callback) {
    this.insertOrFindEntityOnly(entDef, entKey, (entID) => {
      this.insertAndUprateProps(entID, entDef.props, () => {
        callback(entID)
      });
    });
  }

  // Oh, I have forgotten about the parent propStruct, as well as inserting the
  // specs..





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
        let title = entDefObj;
        this.#insertOrFindSimpleEntity(title, callback);
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
  // referred to by entKey is ready.
  #waitForIDThen(entKey, callback) {
    let idOrCallbackArr = this.#entKeyIDStore[entKey];
    
    // If idOrCallbackArr is an array (of callbacks), simply append callback.
    if (Array.isArray(idOrCallbackArr)) {
      idOrCallbackArr.push(callback);
      return;
    }

    // Else if idOrCallbackArr is undefined, create a new callback array
    if (idOrCallbackArr === undefined) {
      this.#entKeyIDStore[entKey] = [callback];
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
  #storeIDAndResolve(entKey, entID) {
    let callbackArr = this.#entKeyIDStore[entKey] ?? [];

    // Verify that the callback array is not already replaced with an ID by
    // an earlier call to this method.
    if (!Array.isArray(callbackArr)) {
      throw (
        'EntityInserter: The key "' + entKey + '" is already used.'
      );
    }

    // Call all the callbacks with the entID (and key) as input, then exchange
    // the callback array for the entID.
    callbackArr.forEach(callback => {
      callback(entID, entKey);
    });
    this.#entKeyIDStore[entKey] = entID;
    return;
  }
  
  // #inputOrLookupEntity() forwards an input request to the server, but
  // only if the key is not already stored in keyIDStore, either
  // pending or resolved. If key is falsy, then the request is always sent.
  // The supplied callback function is called as soon as the ID is ready (which
  // might be immediately).
  #inputOrLookupEntity(reqData, entKey, callback) {
    if (entKey) {
      let entID = this.#entKeyIDStore[entKey];
      if (entID && typeof entID !== "object") {
        callback(entID);
      } else {
        this.#waitForIDThen(entKey, callback);
        DBRequestManager.input(reqData, (result) => {
          this.#storeIDAndResolve(entKey, result.outID);
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
