
import {DBRequestManager} from "../classes/DBRequestManager.js";



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
      let [tmplID, entInput, strInput, ownStrut, dataLen] = result[0] ?? [];
      entMetadata.tmplID = tmplID;
      entMetadata.entInput = entInput;
      entMetadata.strInput = strInput;
      entMetadata.ownStruct = ownStrut;
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


  // expandPropStruct() expands the propStruct by substituting entID references
  // by nested entData objects. This method also transforms each value into an
  // object like {string: [...]}, {set: [...]}, {list: [...]}, etc.
  static expandPropStruct(propStruct, maxRecLevel, recLevel, callback) {
    maxRecLevel ??= 2;
    recLevel ??= 0;
    if (recLevel > maxRecLevel) {
      return;
    }

    let callbackHandler = new ParallelCallbackHandler();

    Object.keys(propStruct).forEach(propKey => {
      propVal = propStruct[propKey];
      
      if (Array.isArray(propVal)) {
        let elemArr = propStruct[propKey];
        propStruct[propKey] = {set: elemArr};
        this.#expandElements(
          elemArr, callbackHandler, propKey, maxRecLevel, recLevel
        );
      }
      else this.#expandPropVal(
        propVal, propStruct, propKey, callbackHandler, maxRecLevel, recLevel
      );
    });

    callbackHandler.executeThen(callback);
  }


  static #expandElements(
    elemArr, callbackHandler, key, maxRecLevel, recLevel
  ) {
    elemArr.forEach((elem, ind) => {
      if (Array.isArray(elem)) {
        elemArr[ind] = {list: elem};
        this.#expandElements(
          elem, callbackHandler, key + "-" + ind, maxRecLevel, recLevel
        );
      }
      else this.#expandPropVal(
        elem, elemArr, ind, callbackHandler, key, maxRecLevel, recLevel
      )
    });
  }


  static #expandPropVal(
    propVal, obj, objKey, callbackHandler, key, maxRecLevel, recLevel
  ) {
    if (/^@[1-9][0-9]*$/.test(propVal)) {
      let entID = propVal.substring(1);
      callbackHandler.push(key, () => {
        this.fetchMetadata(entID, (entMetadata) => {
          obj[objKey] = {ent: entMetadata};
          expandPropStruct(entMetadata.propStruct, maxRecLevel, recLevel + 1);
          callbackHandler.resolve(key);
        })
      });
    }
    else if (typeof propVal === "string") {
      let strArr = propVal.match(/([^@]|\\@)+|@[0-9]*/g);
      strArr.forEach((str, ind) => {
        if (/^@[1-9][0-9]*$/.test(str)) {
          let entID = str.substring(1);
          let newKey = key + "-" + ind;
          callbackHandler.push(newKey, () => {
            this.fetchMetadata(entID, (entMetadata) => {
              strArr[ind] = {ent: entMetadata};
              expandPropStruct(
                entMetadata.propStruct, maxRecLevel, recLevel + 1
              );
              callbackHandler.resolve(newKey);
            })
          });
        }
        else return;
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


  // DataFetcher.fetchAll() takes a request object, rqObj, and calls callback
  // at the end when all requests are fulfilled.
  // The structure of reqObj is:
  // reqObj = {
  //   key1: {
  //     entKey: (falsy | ID | {entID: ID} | SecondaryEntKey),
  //     property: ("propStruct" | {relID: ID} | {metadata: MetadataKey}),
  //     dependencies: (falsy | KeyArr),
  //     getIsReady: (reqObj) => (true | false),
  //     getEntKey: (falsy | (reqObj) => entKey),
  //     status: (falsy | "waiting" | "success" | "failure" | "skipped"),
  //     isDone: (falsy | true),
  //     result: (falsy | object | entID | string | ...),
  //   },
  //   key2: {...},
  //   ...
  // },
  // KeyArr := [key1, key2, ...],
  // SecondaryEntKey := TODO...
  // MetadataKey := TODO...
  //
  // If a request has dependencies it wait for those requests (referenced by
  // their keys) to be done first. If a key is accompanied by the value true,
  // the request is only carried out if the referenced request is successful,
  // and if it is accompanied by false, the request is only carried out if
  // the referenced request is un-successful.
  // static fetchAll(reqObj, callback) {
  //   Object.keys(reqObj).forEach(key => {
  //     let req = reqObj[key];

  //     // Do nothing if status is either "waiting", "success", or "failure".
  //     if (req.status) return;

  //     // Else if all dependencies are done, check req.getIsReady() and if it
  //     // returns false, skip this request entirely. If is is true, however,
  //     // carry out the request.
  //     if (dependenciesAreDone(reqObj, req)) {
  //       // Mark the request as "skipped" if not req.getIsReady().
  //       let getIsReady = req.getIsReady ?? (() => true);
  //       if (!getIsReady(reqObj)) {
  //         req.status = "skipped";
  //         req.isDone = true;
  //         return;
  //       }

  //       // Else mark the request as "waiting".
  //       req.status = "waiting";

  //       // Then get the entKey, potentially from previously fetched results.
  //       var entKey = req.entKey ?? req.getEntKey(reqObj);

  //       // Then fetch the data.
  //       this.fetch(entKey, req.property, (result, isSuccess) => {
  //         // Whenever new data returns from the server, first set the status
  //         // and result.
  //         req.result = result;
  //         req.status = (isSuccess) ? "success" : "failure";
  //         req.isDone = true;

  //         // Then if not all data has been fetched, call this fetchAll() method
  //         // once again to see if new requests need to be made.
  //         if (!getIsFinished(reqObj)) {
  //           this.fetchAll(reqObj, callback)
  //         }

  //         // Else finally call the callback, and pass it the reqObj, as well
  //         // as the last result and key.
  //         else {
  //           callback(reqObj, result, key)
  //         }
  //       });
  //     } 
  //   });
  // }


  // // DataFetcher.fetch() branches according to the input property in order to
  // // fetch the appropriate data.
  // static fetch(entKey, property, callback) {
  //   // First get entID from the entKey.
  //   const entID = getEntID(entKey);

  //   // If property is just a string, interpret as a request to search the
  //   // defining propStruct, before the text/binary dataInput is substituted
  //   // into it, for the value of the property with that name.
  //   if (property === "propStruct") {
  //     fetchPropStructData(entID, (entMetadata) => {
  //       let result = entMetadata;
  //       let isSuccess = !entMetadata.error && entMetadata;
  //       callback(result, isSuccess);
  //     });
  //   }
    

  //   // TODO: Add more.
  // }

}


// TODO: Describe.
function getEntID(entKey) {
  // If entKey is a string of digits, interpret it as the entID itself. 
  if (typeof entKey === "object" ) {
    return entKey;
  }

  // If entKey includes an entID property, return the value of that.
  if (entKey.entID) {
    return entKey.entID;
  }

  // TODO: Add more.
}




// isFinished() returns true if reqObj has no further requests pending or
// needed, and returns false otherwise.
function getIsFinished(reqObj) {
  return Object.values(reqObj).reduce(
    (acc, req) => {
      let status = req.status;
      return acc && (status && status !== "waiting");
    },
    true
  );
}


function dependenciesAreDone(reqObj, req) {
  // If there are no dependencies, return true. Else go through each dependency
  // and check that all dependencies are either fetched or skipped.
  return !req.dependencies || req.dependencies.reduce(
    (acc, key) => (acc && reqObj[key].status),
    true
  );
}

// function dependenciesAreMet(reqObj, req) {
//   // If there are no dependencies, return true. Else go through each dependency
//   // and check that all dependencies are fetched successfully
//   return !req.dependencies || Object.keys(req.dependencies).reduce(
//     (acc, key) => {
//       let val = req.dependencies[key];
//       let status = reqObj[key].status;
//       return acc && (
//         val && status === "success" ||
//         !val && status === "failure"
//       );
//     },
//     true
//   );
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
