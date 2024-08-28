
import {DBRequestManager} from "../classes/DBRequestManager.js";



export class DataFetcher {
  
  // DataFetcher.fetch() takes a request object, rqObj, and calls callback not
  // just at the end when all requests are fulfilled, but calls it each time
  // a request is completed, with the given reqObj key and the fetched result
  // as the inputs to the callback.
  // The structure of reqObj is:
  // reqObj = {
  //   key1: {
  //     dependencies: (falsy | KeyObj),
  //     entKey: (ID | {entID: ID} | SecondaryEntKey),
  //     property: (string | {(propID|relID): ID} | {metadata: MetadataKey}),
  //     status: (falsy | "waiting" | "success" | "failure"),
  //   },
  //   key2: {...},
  //   ...
  // },
  // KeyArr := {key1: (true|false), key2: (true|false), ...],
  // SecondaryEntKey := TODO...
  // MetadataKey := TODO...
  //
  // If a request has dependencies it wait for those requests (referenced by
  // their keys) to be done first. If a key is accompanied by the value true,
  // the request is only carried out if the referenced request is successful,
  // and if it is accompanied by false, the request is only carried out if
  // the referenced request is un-successful.
  static fetchAll(reqObj, callback) {
    Object.keys(reqObj).forEach(key => {
      let req = reqObj[key];

      // Do nothing if status is either "waiting", "success", or "failure".
      if (req.status) return;

      // Else, if there are no dependencies or all dependencies are done,
      // carry out the request.
      if (dependenciesAreReady(reqObj, req)) {
        req.status = "waiting";
        this.fetch(req.entKey, req.property, (result, isSuccess) => {
          // Whenever new data returns from the server, first set the status,
          // then call the callback on the key and the result, and then call
          // this fetchAll() method once again to see if new requests need
          // to be made.
          req.status = (isSuccess) ? "success" : "failure";
          callback(key, result);
          this.fetchAll(reqObj, callback);
        });
      } 
    });
  }


  // TODO: Describe.
  static fetch(entKey, property, callback) {
    
  }

}




function dependenciesAreReady(reqObj, req) {
  // If there are no dependencies, return true.
  if (!req.dependencies) return true;

  // Else go through each dependency and check that all dependencies are
  // fetched, and with the right outcome.
  var areReady = true;
  return Object.keys(req.dependencies).forEach(key => {
    // If areReady is already false, return immediately.
    if (!areReady) return;

    // Else check that the status of the referenced req is not falsy or
    // "waiting", and set areReady = false if it is.
    let status = reqObj[key].status;
    if (!status || status === "waiting") {
      areReady = false;
      return;
    }

    // Else check that the status matches the required one.
    if (req.dependencies[key]) {
      areReady = (status === "success") ? true : false;
    } else {
      areReady = (status === "failure") ? true : false;
    }
    return;
  });
}







export function fetchPropStructData(entID, callback) {
  let entData = {
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
    let [tmplID, entInput, strInput, opsLen, dataLen] = result[0] ?? [];
    entData.tmplID = tmplID;
    entData.entInput = entInput;
    entData.strInput = strInput;
    entData.ownStruct = (opsLen > 0) ? null : {};
    entData.dataLen = dataLen;

    // If entity is missing, set error msg and return.
    if (!tmplID && tmplID != 0) {
      entData.error = "entity missing";
      callback(entData);
    }

    // Else if psLen > 0, get the entity's own propStruct before continuing.
    else if (opsLen > 0) {
      let reqData = {
        req: "entOPS",
        id: entID,
        l: 0,
        s: 0,
      };
      DBRequestManager.query(reqData, (result) => {
        entData.ownStruct = (result[0] ?? [])[0];
        // Continue by looking up the template and construct the propStruct.
        fetchTemplateAndCreatePropStruct(entData, callback);
      });
    }

    // Else continue by looking up the template and construct the propStruct.
    else fetchTemplateAndCreatePropStruct(entData, callback);
  });
}


function fetchTemplateAndCreatePropStruct(entData, callback) {
  let reqData = {
    req: "entOPS",
    id: entData.tmplID,
  };
  DBRequestManager.query(reqData, (result) => {
    entData.template = (result[0] ?? [{}])[0].template;
    parseAndConstructPropStruct(entData, callback);
  });
}



function parseAndConstructPropStruct(entData, callback) {
  // Initialize the propStruct as the un-substituted template.
  let propStruct = Object.assign({}, entData.template);

  // Replace all /%e[0-9]/ placeholders in the values of the template by the
  // entity inputs. 
  let entInputArr = entData.entInput.split(",");
  substitutePlaceholders(propStruct, /%e[0-9]/g, placeholder => {
    let n = parseInt(placeholder.substring(2));
    return entInputArr[n] ?? "";
  });

  // Replace all /%s[0-9]/ placeholders in the values of the template by the
  // string inputs, separated by '|'.
  let strInputArr = getStrInputArr(entData.strInput);
  substitutePlaceholders(propStruct, /%s[0-9]/g, placeholder => {
    let n = parseInt(placeholder.substring(2));
    return strInputArr[n] ?? "";
  });

  // Replace any /%s/ placeholders in the values of the template by the
  // whole string input. 
  let strInput = entData.strInput;
  substitutePlaceholders(propStruct, /%s/g, () => strInput);

  // Finally copy the object's own property struct into the template. 
  entData.propStruct = Object.assign(propStruct, entData.ownStruct);

  // Then call the callback function and return.
  callback(entData);
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
