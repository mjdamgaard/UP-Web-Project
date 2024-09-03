
import {DBRequestManager} from "../classes/DBRequestManager.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";


export class DataFetcher {
  


  static fetchMetadata(entID, callback) {
    let entMetadata = {
      entID: entID,
      propStruct: null,
      tmplID: null,
      entInput: null,
      strInput: null,
      ownStruct: null,
      dataLen: null,
      template: null,
      // entInputNames: null,
      // strInputNames: null,
      error: false,
    };
    let reqData = {
      req: "ent",
      id: entID,
    };
    DBRequestManager.query(reqData, (result) => {
      let [tmplID, entInput, strInput, ownStruct, dataLen] = result[0] ?? [];
      entMetadata.tmplID = tmplID;
      entMetadata.entInput = entInput;
      entMetadata.strInput = strInput;
      entMetadata.ownStruct = ownStruct;
      entMetadata.dataLen = dataLen;

      // If entity is missing, set error msg and return.
      if (!tmplID && tmplID != 0) {
        entMetadata.error = "entity missing";
        callback(entMetadata);
      }

      // Else continue by looking up the template and construct the propStruct.
      let reqData = {
        req: "ent",
        id: entMetadata.tmplID,
      };
      DBRequestManager.query(reqData, (result) => {
        let [,,,tmplPropStruct] = result[0] ?? [];
        entMetadata.template = (tmplPropStruct ?? {}).template;
        parseAndConstructPropStruct(entMetadata, callback);
      });
    });
  }


  static fetchExpandedMetadata(entID, maxRecLevel, recLevel, callback) {
    if (!callback) {
      callback = recLevel;
      recLevel = 0;
    }
    if (!callback) {
      callback = maxRecLevel;
      maxRecLevel = 2;
    }
    this.fetchMetadata(entID, (entMetadata) => {
      this.expandPropStruct(
        entMetadata.propStruct, entID, maxRecLevel, recLevel, () => {
          callback(entMetadata);
        }
      );
    });
  }


  // expandPropStruct() expands the propStruct by substituting entID references
  // by nested entData objects. This method also transforms each value into an
  // object like {string: [...]}, {set: [...]}, {list: [...]}, etc.
  static expandPropStruct(propStruct, entID, maxRecLevel, recLevel, callback) {
    if (!callback) {
      callback = recLevel;
      recLevel = 0;
    }
    if (!callback) {
      callback = maxRecLevel;
      maxRecLevel = 2;
    }

    let callbackHandler = new ParallelCallbackHandler();

    Object.keys(propStruct).forEach(propKey => {
      let propVal = propStruct[propKey];
      
      if (Array.isArray(propVal)) {
        let elemArr = propStruct[propKey];
        propStruct[propKey] = {set: elemArr};
        this.#expandElements(
          elemArr, callbackHandler, propKey, maxRecLevel, recLevel
        );
      }
      else this.#expandPropVal(
        propVal, propStruct, propKey, entID, callbackHandler,
        maxRecLevel, recLevel
      );
    });

    callbackHandler.executeThen(callback);
  }


  static #expandElements(
    elemArr, thisID, callbackHandler, key, maxRecLevel, recLevel
  ) {
    elemArr.forEach((elem, ind) => {
      if (Array.isArray(elem)) {
        elemArr[ind] = {list: elem};
        this.#expandElements(
          elem, thisID, callbackHandler, key + "-" + ind, maxRecLevel, recLevel
        );
      }
      else this.#expandPropVal(
        elem, elemArr, ind, thisID, callbackHandler, key, maxRecLevel, recLevel
      )
    });
  }


  static #expandPropVal(
    propVal, obj, objKey, thisID, callbackHandler, key, maxRecLevel, recLevel
  ) {
    if (/^@[1-9][0-9]*$/.test(propVal)) {
      let entID = propVal.substring(1);
      if (recLevel > maxRecLevel) {
        obj[objKey] = {ent: {entID: entID}};
      }
      else {
        callbackHandler.push(key, () => {
          this.fetchMetadata(entID, (entMetadata) => {
            obj[objKey] = {ent: entMetadata};
            this.expandPropStruct(
              entMetadata.propStruct, entID, maxRecLevel, recLevel + 1
            );
            callbackHandler.resolve(key);
          })
        });
      }
    }
    if (/^@[1-9][0-9]*c[1-9][0-9]*$/.test(propVal)) {
      let [entID, expectedClassID] = propVal.match(/[1-9][0-9]*/g);
      if (recLevel > maxRecLevel) {
        obj[objKey] = {
          entOfClass: {entID: entID, expectedClassID: expectedClassID}
        };
      }
      else {
        callbackHandler.push(key, () => {
          this.fetchMetadata(entID, (entMetadata) => {
            obj[objKey] = {
              entOfClass: Object.assign(
                {expectedClassID: expectedClassID},
                entMetadata
              )
            };
            this.expandPropStruct(
              entMetadata.propStruct, entID, maxRecLevel, recLevel + 1
            );
            callbackHandler.resolve(key);
          })
        });
      }
    }
    else if (propVal === "@this") {
      obj[objKey] = {thisEntID: thisID};
    }
    else if (typeof propVal === "string") {
      let stringLexRegEx = /([^@%]|\\@|\\%)+|@[0-9a-z]*|%[a-z0-9]*|.+/g;
      let strArr = propVal.match(stringLexRegEx);
      obj[objKey] = {string: strArr};
      strArr.forEach((str, ind) => {
        if (/^([^@%]|\\@|\\%)+$/.test(str)) {
          return;
        }
        else if (str[0] === "@") {
          if (/^@[1-9][0-9]*$/.test(str)) {
            let entID = propVal.substring(1);
            if (recLevel > maxRecLevel) {
              strArr[ind] = {ent: {entID: entID}};
            }
            else {
              let newKey = key + "-" + ind;
              callbackHandler.push(newKey, () => {
                this.fetchMetadata(entID, (entMetadata) => {
                  strArr[ind] = {ent: entMetadata};
                  this.expandPropStruct(
                    entMetadata.propStruct, entID, maxRecLevel, recLevel + 1
                  );
                  callbackHandler.resolve(newKey);
                })
              });
            }
          }
          else if (str === "@this") {
            strArr[ind] = {thisEntID: thisID};
          }
          else {
            strArr[ind] = {illFormedReference: str};
          }
        }
        else if (str[0] === "%") {
          if (str === "%t") {
            strArr[ind] = {fullTextPlaceholder: true};
          }
          else if (/^%t[0-9]$/.test(str)) {
            strArr[ind] = {textPlaceholder: str[2]};
          }
          else if (str === "%d") {
            strArr[ind] = {dataPlaceholder: true};
          }
          else if (/^%e[0-9]$/.test(str)) {
            strArr[ind] = {unusedEntityPlaceholder: str[2]};
          }
          else if (str === "%s") {
            strArr[ind] = {unusedFullStringPlaceholder: true};
          }
          else if (/^%s[0-9]$/.test(str)) {
            strArr[ind] = {unusedStringPlaceholder: str[2]};
          }
          else {
            strArr[ind] = {illFormedPlaceholder: str};
          }
        }
        else {
          strArr[ind] = {illFormedString: str};
        }
      });
    }
    else throw "DataFetcher.expandPropVal(): Unexpected type.";
  }


  // substituteDataInput(entID, propStruct) fetches dataInput from the entity
  // and substitutes the relevant placeholders in propStruct. If propStruct
  // has nested entity objects in it (as a result of expandPropStruct()), the
  // data for these propStructs are also fetched and substituted, unless
  // maxRecLevel is exceeded. This method also transforms each value into an
  // object like {string: [...]}, {set: [...]}, {list: [...]}, etc.
  static substituteDataInput(entID, propStruct, maxRecLevel, recLevel) {
    maxRecLevel ??= 2;
    recLevel ??= 0;

  }

}


// // TODO: Describe.
// function getEntID(entKey) {
//   // If entKey is a string of digits, interpret it as the entID itself. 
//   if (typeof entKey === "object" ) {
//     return entKey;
//   }

//   // If entKey includes an entID property, return the value of that.
//   if (entKey.entID) {
//     return entKey.entID;
//   }

//   // TODO: Add more.
// }






function parseAndConstructPropStruct(entMetadata, callback) {
  // Initialize the propStruct as the un-substituted template.
  let propStruct = Object.assign({}, entMetadata.template);

  // Replace all /%e[0-9]/ placeholders in the values of the template by the
  // entity inputs. 
  let entInputArr = entMetadata.entInput.split(",");
  substitutePlaceholders(propStruct, /%e[0-9]/g, placeholder => {
    let n = parseInt(placeholder.substring(2));
    return entInputArr[n] ?? "";
  });

  // Replace all /%s[0-9]/ placeholders in the values of the template by the
  // string inputs, separated by '|'.
  let strInputArr = getStrInputArr(entMetadata.strInput);
  substitutePlaceholders(propStruct, /%s[0-9]/g, placeholder => {
    let n = parseInt(placeholder.substring(2));
    return strInputArr[n] ?? "";
  });

  // Replace any /%s/ placeholders in the values of the template by the
  // whole string input. 
  let strInput = entMetadata.strInput;
  substitutePlaceholders(propStruct, /%s/g, () => strInput);

  // Finally copy the object's own property struct into the template. 
  entMetadata.propStruct = Object.assign(propStruct, entMetadata.ownStruct);

  // Then call the callback function and return.
  callback(entMetadata);
  return;
}


export function substitutePlaceholders(propStruct, regex, substituteFun) {
  Object.keys(propStruct).forEach(propKey => {
    let propVal = propStruct[propKey];
    propStruct[propKey] = propVal.replaceAll(regex, substituteFun);
  });
}


export function getStrInputArr(strInput) {
  return strInput
    .replaceAll("\\\\", "\\\\0")
    .replaceAll("\\|", "\\\\1")
    .split("|")
    .map(val => {
      return val
      .replaceAll("\\\\1", "|")
      .replaceAll("\\\\0", "\\");
    });
}








// function getEntInputNames(template) {
//   let ret = [];
//   let placeholderOnlyRegEx = /^%e[0-9]$/;
//   Object.keys(template).forEach(propKey => {
//     let propVal = template[propKey];
//     if (placeholderOnlyRegEx.test(propVal)) {
//       let n = parseInt(propVal.substring(1));
//       ret[n] ??= propKey;
//     }
//   });
//   return ret;
// }


// function getStrInputNames(template) {
//   let ret;
//   let wholeStrPlaceholderOnlyRegEx = /^%s$/;
//   Object.keys(template).forEach(propKey => {
//     let propVal = template[propKey];
//     if (wholeStrPlaceholderOnlyRegEx.test(propVal)) {
//       ret ??= propKey;
//     }
//   });
//   if (ret) return;

//   // If no 'propKey:"%s"' member was found, look for 'propKey:"%s[0-9]"'
//   // members and return an array of the relevant propKeys.
//   ret = [];
//   let splitStrPlaceholderOnlyRegEx = /^%s[0-9]$/;
//   Object.keys(template).forEach(propKey => {
//     let propVal = template[propKey];
//     if (splitStrPlaceholderOnlyRegEx.test(propVal)) {
//       let n = parseInt(propVal.substring(1));
//       ret[n] ??= propKey;
//     }
//   });
//   return ret;
// }
