
import {DBRequestManager} from "../classes/DBRequestManager.js";




export class EntityInserter {

  constructor(accountManager, entKeyIDStore) {
    // Public properties:
    this.accountManager = accountManager;
    this.entKeyIDStore = entKeyIDStore ?? {
      // "@s.<JSON string>" is reserved for string/simple entities.
      // "@p.<JSON string>" is reserved for property entities.
      // "@pt.<JSON string>" is reserved for property tag entities.
    };
  }

  #getIDOrThrow(entKey) {
    let id = this.entKeyIDStore[entKey];
    if (typeof id !== "string") {
      throw "EntityInserter: missing key: " + entKey;
    }
    return id;
  }


  getSubstitutedString(str) {
    let entKeyRegEx =
      /(^|[^\\@])(\\\\)*@([a-z]+\.)?"([^"\\]|\\.)*"/g;
    let illFormedEntKeyRegEx =
      /(^|[^\\@])(\\\\)*@([a-z]+\.)?"([^"\\]|\\.)*$/g;
    if (illFormedEntKeyRegEx.test(str)) {
      throw "EntityInserter: ill-formed entKey in: '" + str + "'";
    }

    // Replace all entKey references with entID references instead.
    return str.replaceAll(entKeyRegEx, val => {
      let [leadingChars, entKey] = val.match(/^(\\\\)*@|[^@].*$/g);
      return leadingChars + this.#getIDOrThrow(entKey);
    });
  }


  // substitutePropsAndValues(props) substitute all occurrences of
  // /@([a-z]+\.)?"([^"\\]|\\.)*"/ in props, both for its value and its keys. 
  substitutePropKeysAndValues(props) {
    let entKeyRegEx = /@([a-z]+\.)?"([^"\\]|\\.)*"/g;
    props.keys().forEach(prop => {
      // Substitute all entKey references in prop.
      let newProp = this.getSubstitutedString(prop)
      if (newProp !== prop) {
        props[newProp] = props[prop];
        delete props[prop];
      }

      // Substitute all entKey references in val if it is a string.
      let val = props[newProp];
      if (typeof val === "string") {
        props[newProp] = this.getSubstitutedString(val);
      }
      // Else if val is an object, including an array, call this method on each
      // value/element.
      else if (val && typeof val === "object") {
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
    // if (this.entKeyIDStore[entKey]) {
    //   throw "EntityInserter: entKey " + entKey + " is already in use";
    // }
    this.substitutePropsAndFillOut(entDef)
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: entDef.parentID,
      s: entDef.spec,
      o: entDef.props,
      d: entDef.data,
    };
    DBRequestManager.input(reqData, (result) => {
      // Note that entKeys starting with [0-9] is no use.
      if (typeof entKey === "string") {
        this.entKeyIDStore[entKey] = result.outID;
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
    if (this.entKeyIDStore["@p." + propKey]) {
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
      o: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.entKeyIDStore["@p." + propKey] = result.outID;
      this.#insertPropKeysHelper(propKeys, ind + 1, callback);
    });
  }


  // insertPropValues() can be called after substitutePropKeysAndValues()
  // in order to also insert all the property values.
  insertPropValues(props, callback) {
    let propKeys = props.keys();
    let ind = 0;
    let depth = 0;
    this.#insertPropValuesHelper(propKeys, ind, props, depth, callback)
  }

  #insertPropValuesHelper(propKeys, ind, props, depth, callback) {
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
    if (this.entKeyIDStore["@s." + val]) {
      this.#insertPropValuesHelper(propKeys, ind + 1, props, depth, callback);
    }


    // If val is an array and depth == 0, meaning that it is set of property
    // values, insert each element. If depth == 1, however, the array is a
    // list and should be inserted as such.
    if (Array.isArray(val)) {
      if (depth === 0) {
        this.#insertPropValuesHelper(val.keys(), 0, props, 1, () => {
          this.#insertPropValuesHelper(propKeys, ind + 1, props, 0, callback);
        });
        return;
      }
      else {
        this.insertList(val, () => {
          this.#insertPropValuesHelper(propKeys, ind + 1, props, 1, callback);
        });
        return;
      }
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
      o: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.entKeyIDStore["@s." + propKey] = result.outID;
      this.#insertPropValuesHelper(propKeys, ind + 1, props, depth, callback);
    });
  }


  // insertList() inserts a list but doesn't insert or up-rate any properties.
  // Note that substitutePropKeysAndValues() should be called first.
  insertList(elemArr, callback) {
    if (!Array.isArray(elemArr)) {
      throw "insertList(): input has to be an array";
    }
    let listJSON = JSON.stringify(elemArr);
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: "7",
      s: listJSON,
      o: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.entKeyIDStore["@l." + listJSON] = result.outID;
      callback(result.outID);
    });
  }



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
    if (this.entKeyIDStore[propTagEntKey]) {
      this.#insertPropKeysAndPropTagsHelper(propKeys, ind + 1, entID, callback);
    }

    // Else insert it as the propTag entity (parentID = 5) and continue.
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: "5",
      s: entID + "|" + propID,
      o: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.entKeyIDStore[propTagEntKey] = result.outID;
      this.#insertPropKeysAndPropTagsHelper(propKeys, ind + 1, entID, callback);
    });
  }



  // insertAndUprateProps() first calls substitutePropKeysAndValues(),
  // insertPropKeysAndPropTags(), insertPropValues(), and
  // insertRelevantPropertiesTag(), then go through each property and up-rates
  // all values.
  insertAndUprateProps(entID, props, callback) {
    this.substitutePropKeysAndValues(props);
    this.insertPropKeysAndPropTags(entID, props, () => {
      this.insertPropValues(props, () => {
        this.insertRelevantPropertiesTag(entID, (rptID) => {
          // After having substituted entKeys in props, then inserted property
          // keys, property tags, and values, go through each property key,
          // get the given property tag, and get an array of all values to
          // up-rate for that propTag.
          props.keys().forEach(propKey => {
            var propID;
            // If propKey is an ID reference, get that.
            if (/^@[1-9][0-9]*$/.test(propKey)) {
              propID = propKey.slice(1);
            }
            // Or if propKey is a string, get the ID from the @p.<string>
            // entKey.
            else {
              propID = this.#getIDOrThrow("@p." + propKey);
            }
            // Get the stored propTag ID.
            let propTagID = this.#getIDOrThrow("@pt." + entID + "." + propID);
            
            // Get all non-list values.
            let valSet = props[propKey];
            var valArr = Array.isArray(valSet) ? valSet : [valSet];
            valArr.forEach(val => {
              var valID;
              // If val is an ID reference, get that.
              if (/^@[1-9][0-9]*$/.test(val)) {
                valID = val.slice(1);
              }
              // Or if val is a string, get the ID from the @s.<string> entKey.
              else if (typeof val === "string") {
                valID = this.#getIDOrThrow("@s." + val);
              }
              // Or if it is an array, get the ID from the @l.<json> entKey.
              else if (Array.isArray(val)) {
                valID = this.#getIDOrThrow("@l." + JSON.stringify(val));
              }
              else {
                throw "insertAndUprateProps(): value has unexpected type";
              }

              // Now send a request to uprate this valID for the given
              // propTagID.
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
                  "rating input outID: " + result.outID +
                  ", and exitCode: " + result.exitCode
                );
              });
            });

            // Also up-rate propTagID as a relevant property.
            let reqData = {
              req: "rat",
              ses: this.accountManager.sesIDHex,
              u: this.accountManager.inputUserID,
              t: rptID,
              i: propTagID,
              r: "255",
            };
            DBRequestManager.input(reqData, (result) => {
              // console.log(
              //   "rpt rating input outID: " + result.outID +
              //   ", and exitCode: " + result.exitCode
              // );
            });
          });
          callback();
        });
      });
    });
  }



  // insertRelevantPropertiesTag() takes an entID an inserts or finds the
  // 'relevant properties' tag for that entity, then stores it with the key
  // "@rpt.<entID>"
  insertRelevantPropertiesTag(entID, callback) {
    let reqData = {
      req: "ent",
      ses: this.accountManager.sesIDHex,
      u: this.accountManager.inputUserID,
      p: "9",
      s: entID,
      o: "",
      d: "",
    };
    DBRequestManager.input(reqData, (result) => {
      this.entKeyIDStore["@rpt." + entID] = result.outID;
      callback(result.outID);
    });
  }



  // insertOrFindEntityThenInsertAndUprateProps() inserts an entity defined by
  // entDef, stores it outID with the entKey in the entKeyIDStore, then
  // inserts properties and values from entDef.props, if any, and up-rates
  // all these property values If a value in props is an array (not nested),
  // then it is interpreted as a set of property values, and each is inserted
  // and up-rated individually. Nested arrays are interpreted and inserted as
  // lists.
  insertOrFindEntityThenInsertAndUprateProps(entDef, entKey, callback) {
    this.insertOrFindEntityOnly(entDef, entKey, (entID) => {
      this.insertAndUprateProps(entID, entDef.props, () => {
        callback(entID)
      });
    });
  }

  // Oh, I have forgotten about the parent ownStruct, as well as inserting the
  // specs.. ..Oh well, let that wait for now. ...Oh wait, this is quite easy,
  // 'cause I can just make a transProps which is constructed from props, spec,
  // and the parent (and ancestors') ownStruct(s), before using this
  // transProps as the props input for the next methods.










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




  // // TODO: Remake, perhaps using substitutePropKeysAndValues() (..Nah): ...Ah,
  // // substitutePropKeysAndValues() should just do this already..
  // // getSubstitutedText() takes a text containing key references of the form
  // // /@[a-zA-Z][\w_]*\./ and substitutes these with entity references of the
  // // form /@[1-9][0-9]*\./, by looking up the entity IDs via calls to the
  // // #waitForIDThen() method. getSubstitutedText() then finally calls the
  // // supplied callback function on the converted text.
  // getSubstitutedText(text, callback) {
  //   // If there are no key references (left) in the text, convert all
  //   // occurrences of '\@' to '@', and '\\' to '\', and verify that there are
  //   // no ill-formed references, then call the callback function and return;
  //   let firstKeyReference = (text.match(/@[a-zA-Z][\w_]*\./g) ?? [])[0];
  //   if (!firstKeyReference) {
  //     let transformedText = text
  //       .replaceAll("\\\\", "\\\\0")
  //       .replaceAll("\\@", "\\\\1");
  //     let containsIllFormedRefs = (
  //       transformedText.match(/@/g).length !==
  //       transformedText.match(/@[1-9][0-9]*\./g).length
  //     );
  //     if (containsIllFormedRefs) {
  //       throw (
  //         'EntityInserter: Text "' + text + '" contains ill-formed references.'
  //       );
  //     }
  //     // If this test succeeds, call the callback function on the (final) text.
  //     callback(text);
  //     return;
  //   }

  //   // Else wait for the ID of the first key reference, then call this method
  //   // again recursively on the text with this first key reference substituted.
  //   this.#waitForIDThen(firstKeyReference, (entID) => {
  //     let newText = text.replace(firstKeyReference, "@" + entID + ".");
  //     this.getSubstitutedText(newText, callback);
  //   });
  //   return;
  // }
  // #waitForIDThen() {}



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
