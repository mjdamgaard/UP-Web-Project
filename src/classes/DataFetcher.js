
import {DBRequestManager} from "../classes/DBRequestManager.js";



export class DataFetcher {
  
  static fetch() {

  }

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
