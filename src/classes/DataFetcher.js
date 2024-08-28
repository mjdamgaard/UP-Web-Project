
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
    entInputNames: null,
    strInputNames: null,
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
  let propStruct = {};

  // First get the property names of all the entity inputs.



  entData.propStruct = Object.assign(propStruct, entData.ownStruct);

  callback(entData);
  return;
}


function getEntInputNames(template) {
  let ret = [];
  let placeholderOnlyRegEx = /^%e[0-9]$/;
  Object.keys(template).forEach(propKey => {
    let propVal = template[propKey];
    if (placeholderOnlyRegEx.test(propVal)) {
      let n = parseInt(propVal.substring(1));
      ret[n] ??= propKey;
    }
  });
  return ret;
}


function getStrInputNames(template) {
  let ret;
  let wholeStrPlaceholderOnlyRegEx = /^%s$/;
  Object.keys(template).forEach(propKey => {
    let propVal = template[propKey];
    if (wholeStrPlaceholderOnlyRegEx.test(propVal)) {
      ret ??= propKey;
    }
  });
  if (ret) return;

  // If no 'propKey:"%s"' member was found, look for 'propKey:"%s[0-9]"'
  // members and return an array of the relevant propKeys.
  ret = [];
  let splitStrPlaceholderOnlyRegEx = /^%s[0-9]$/;
  Object.keys(template).forEach(propKey => {
    let propVal = template[propKey];
    if (splitStrPlaceholderOnlyRegEx.test(propVal)) {
      let n = parseInt(propVal.substring(1));
      ret[n] ??= propKey;
    }
  });
  return ret;
}



export function getSpecifiedPropStruct(parPropStruct, spec) {
  var specArr = (typeof spec === "string") ? getSpecArr(spec) : spec;

  // Replace each '%<n>' placeholder in parPropStruct with specArr[<n> - 1].
  // If a specArr[<n> - 1] is undefined, let the placeholder be. Note that is
  // is assumed that '%<n>' will always be followed by space or some sort of
  // punctuation, and never directly by other digits or another placeholder. 
  var ret = {};
  Object.keys(parPropStruct).forEach(prop => {
    let val = parPropStruct[prop];
    // If property value is a string, replace e.g. '%3' with specArr[2], and
    // '\\\\%3' with '\\\\' + specArr[2], unless specArr[2] is undefined.
    if (typeof val === "string") {
      ret[prop] = val.replaceAll(/(^|[^\\%])(\\\\)*%[1-9][0-9]*/g, str => {
        let [leadingChars, n] = val.match(/^[^%]*|[^%].*$/g);
        if (n === undefined) {
          n = leadingChars;
          leadingChars = "";
        }
        let placement = specArr[parseInt(n) - 1];
        if (placement !== undefined) {
          return leadingChars + placement;
        } else {
          return str;
        }
      });
    }
    // Else call getSpecifiedPropStruct recursively to get the substituted val.
    else {
      ret[prop] = getSpecifiedPropStruct(val, specArr);
    }
  });
  return ret;
}

export function getSpecArr(spec) {
  return spec
    .replaceAll("\\\\", "\\\\0")
    .replaceAll("\\|", "\\\\1")
    .split("|")
    .map(val => {
      return val
      .replaceAll("\\\\1", "|")
      .replaceAll("\\\\0", "\\");
    });

}
