
import {DBRequestManager} from "../classes/DBRequestManager.js";
import {ParallelCallbackHandler} from "./ParallelCallbackHandler.js";

const CLASS_CLASS_METADATA_JSON = JSON.stringify({
  entID: 1,
  tmplID: 0,
  mainProps: {title: "class"},
  classID: 1,
  otherPropsLen: 0,
});

export class DataFetcher {
  


  static fetchMainData(entID, callback) {
    let entMainData = {
      entID: entID,
      mainProps: null,
      classID: null,
      tmplID: null,
      entInput: null,
      listInput: null,
      strInput: null,
      otherPropsLen: null,
      template: null,
      isMissing: null,
    };
    let reqData = {
      req: "ent",
      id: entID,
    };
    DBRequestManager.query(reqData, (result) => {
      let [
        classID, tmplID, entInput, listInput, strInput,
        mainProps, otherPropsLen
      ] = result[0] ?? [];

      entMainData.classID = classID;
      entMainData.tmplID = tmplID;
      entMainData.entInput = entInput;
      entMainData.listInput = listInput;
      entMainData.strInput = strInput;
      entMainData.mainProps = mainProps;
      entMainData.otherPropsLen = otherPropsLen;
      entMainData.isMissing = !classID;

      // If entity is missing, call callback immediately and return.
      if (!classID) {
        callback(entMainData);
        return;
      }

      // If entity is has no template, the mainProps is just the fetched
      // mainProps object, and we can call callback already.
      if (tmplID == "0") {
        callback(entMainData);
        return;
      }

      // Else continue by looking up the template and construct the mainProps.
      let reqData = {
        req: "ent",
        id: entMainData.tmplID,
      };
      DBRequestManager.query(reqData, (result) => {
        let [,,,,,tmplMainProps] = result[0] ?? [];
        entMainData.template = (tmplMainProps ?? {}).template;
        parseAndConstructMainProps(entMainData, callback);
      });
    });
  }


  static fetchExpandedMainData(entID, maxRecLevel, recLevel, callback) {
    if (!callback) {
      callback = recLevel;
      recLevel = 0;
    }
    if (!callback) {
      callback = maxRecLevel;
      maxRecLevel = 2;
    }
    this.fetchMainData(entID, (entMainData) => {
      this.expandMainData(entMainData, entID, maxRecLevel, recLevel, () => {
        callback(entMainData);
      });
    });
  }


  // expandMainData() expands the mainProps by substituting entID references
  // by nested entData objects. This method also transforms each value into an
  // object like {string: [...]}, {concat: [...]}, {list: [...]}, etc.
  static expandMainData(entMainData, thisID, maxRecLevel, recLevel, callback) {
    if (!callback) {
      callback = recLevel;
      recLevel = 0;
    }
    if (!callback) {
      callback = maxRecLevel;
      maxRecLevel = 2;
    }

    let mainProps = entMainData.mainProps;

    let callbackHandler = new ParallelCallbackHandler();

    // Prepare callbacks to expand the mainProps.
    Object.keys(mainProps).forEach(propKey => {
      let propVal = mainProps[propKey];
      
      if (Array.isArray(propVal)) {
        let elemArr = mainProps[propKey];
        mainProps[propKey] = {concat: elemArr};
        this.#expandElements(
          elemArr, thisID, callbackHandler, maxRecLevel, recLevel
        );
      }
      else this.#expandPropVal(
        propVal, mainProps, propKey, thisID, callbackHandler,
        maxRecLevel, recLevel
      );
    });

  
    // After all values and nested values have been substituted/expanded,
    // substitute any property name that end with /@c[1-9][0-9]*$/ with one
    // where this ending is removed, but the value is instead wrapped in a
    // classContext wrapper.
    this.#expandClassContextsFromPropNames(mainProps);


    // Prepare callback to get the expanded (with recLevel -= 1) mainData
    // of the entity's class.
    let classID = entMainData.classID;
    // If classID == 1, just use a hard-coded classMainData.
    if (classID == "1") {
      entMainData.classMainData = JSON.parse(CLASS_CLASS_METADATA_JSON);
    }
    // Else fetch the mainData of the class from the database.
    else if (recLevel <= maxRecLevel) {
      callbackHandler.push((resolve) => {
        this.fetchExpandedMainData(
          classID, maxRecLevel, recLevel + 1, (classMainData) => {
            entMainData.classMainData = classMainData;
            resolve();
          }
        );
      });
    }

    callbackHandler.execAndThen(callback);
  }


  static #expandClassContextsFromPropNames(props) {
    Object.keys(props).forEach(propKey => {
      let propVal = props[propKey];
      if (propVal && typeof propVal === "object") {
        this.#expandClassContextsFromPropNames(propVal);
      }
      if (/@c[1-9][0-9]*$/.test(propKey)) {debugger;
        let newPropVal = props[propKey];
        delete props[propKey];
        let newPropKey = propKey.replace(/@c[1-9][0-9]*$/, "");
        let classID = propKey.match(/[0-9]*$/)[0];
        props[newPropKey] = {
          classContext: {classID: classID, value: newPropVal}
        };
      }
    });
  }



  static #expandElements(
    elemArr, thisID, callbackHandler, maxRecLevel, recLevel
  ) {
    elemArr.forEach((elem, ind) => {
      if (Array.isArray(elem)) {
        elemArr[ind] = {list: elem};
        this.#expandElements(
          elem, thisID, callbackHandler, maxRecLevel, recLevel
        );
      }
      else this.#expandPropVal(
        elem, elemArr, ind, thisID, callbackHandler, maxRecLevel, recLevel
      );
    });
  }



  static #expandPropVal(
    propVal, obj, objKey, thisID, callbackHandler, maxRecLevel, recLevel
  ) {
    if (typeof propVal === "object") {
      let struct = propVal;
      obj[objKey] = {struct: struct};
      Object.keys(struct).forEach(key => {
        let val = struct[key];
        this.#expandPropVal(
          val, struct, key, thisID, callbackHandler, maxRecLevel, recLevel
        );
      })
    }
    else if (propVal[0] === "@") {
      if (/^@[1-9][0-9]*$/.test(propVal)) {
        let entID = propVal.substring(1);
        if (recLevel > maxRecLevel) {
          obj[objKey] = {ent: {entID: entID}};
        }
        else {
          callbackHandler.push(resolve => {
            this.fetchExpandedMainData(
              entID,  maxRecLevel, recLevel + 1, (expEntMainData) => {
                obj[objKey] = {ent: expEntMainData};
                resolve();
              }
            );
          });
        }
      }
      else if (/^@[1-9][0-9]*c[1-9][0-9]*$/.test(propVal)) {
        let [entID, expectedClassID] = propVal.match(/[1-9][0-9]*/g);
        if (recLevel > maxRecLevel) {
          let entValue = {ent: {entID: entID}};
          obj[objKey] = {
            classContext: {classID: expectedClassID, value: entValue}
          };
        }
        else {
          callbackHandler.push(resolve => {
            this.fetchExpandedMainData(
              entID,  maxRecLevel, recLevel + 1, (expEntMainData) => {
                let entValue = {ent: expEntMainData};
                obj[objKey] = {
                  classContext: {classID: expectedClassID, value: entValue}
                };
                resolve();
              }
            );
          });
        }
      }
      else if (propVal === "@this") {
        obj[objKey] = {thisEnt: thisID};
      }
      else if (propVal === "" || propVal === "@null") {
        obj[objKey] = {null: true};
      }
      else if (propVal === "@0" || propVal === "@none") {
        obj[objKey] = {none: true};
      }
      else if (propVal === "@bin") {
        obj[objKey] = {binRef: true};
      }
      else if (/^@\[[^\]]+\]$/.test(propVal)) {
        obj[objKey] = {explicitRef: propVal.slice(2, -1)};
      }
      else if (/^@text([1-9][0-9]?)?$/.test(propVal)) {
        obj[objKey] = {textRef: propVal.substring(5) || true};
      }
      else {
        obj[objKey] = {illFormedReference: propVal};
      }
    }
    else if (propVal[0] === "%") {
      if (/^%e[0-9](c[1-9][0-9]*)?$/.test(propVal)) {
        obj[objKey] = {unusedEntityPlaceholder: propVal[2]};
      }
      else if (/^%l[0-9]$/.test(propVal)) {
        obj[objKey] = {unusedListPlaceholder: propVal[2]};
      }
      else if (propVal === "%s") {
        obj[objKey] = {unusedFullStringPlaceholder: true};
      }
      else if (/^%s[0-9]$/.test(propVal)) {
        obj[objKey] = {unusedStringPlaceholder: propVal[2]};
      }
      else {
        obj[objKey] = {illFormedPlaceholder: propVal};
      }
    }
    else if (typeof propVal === "string") {
      let stringLexRegEx =
        /([^@%]|\\@|\\%)+|@[a-z0-9]*|@\[[^\]]+(\]|$)|%[a-z0-9]*|.+/g;
      let strArr = propVal.match(stringLexRegEx);
      if (strArr.length === 1) {
        obj[objKey] = strArr[0];
      }
      else {
        obj[objKey] = {string: strArr};
        strArr.forEach((str, ind) => {
          this.#expandPropVal(
            str, strArr, ind, thisID, callbackHandler, maxRecLevel, recLevel
          )
        });
      }
    }
    else throw (
      'DataFetcher.expandPropVal(): Unexpected type "' + (typeof propVal) +
      '".' 
    );
  }



  // substituteDataInput(entID, mainProps) fetches dataInput from the entity
  // and substitutes the relevant placeholders in mainProps. If mainProps
  // has nested entity objects in it (as a result of expandMainData()), the
  // data for these mainProps are also fetched and substituted, unless
  // maxRecLevel is exceeded. This method also transforms each value into an
  // object like {string: [...]}, {concat: [...]}, {list: [...]}, etc.
  static substituteDataInput(entID, mainProps, maxRecLevel, recLevel) {
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






function parseAndConstructMainProps(entMainData, callback) {
  // Initialize the mainProps as the un-substituted template.
  let mainProps = Object.assign({}, entMainData.template);

  // Replace all /%e[0-9]/ placeholders in the values of the template by the
  // entity inputs. 
  if (entMainData.entInput) {
    let entInputArr = entMainData.entInput.split(",");
    substitutePlaceholders(mainProps, /%e[0-9]/g, placeholder => {
      let n = parseInt(placeholder.substring(2));
      let substitute = entInputArr[n];
      if (substitute === undefined) {
        substitute = "@null"
      }
      // If substitute == "this" or "<num>", return "@this" or "@<num>".
      else {
        substitute = "@" + substitute;
      }
      return substitute;
    });
  }

  // Replace all /%l[0-9]/ placeholders in the values of the template by the
  // list inputs, separated by '|'. Make sure to split() each list, which is a
  // comma-separated list of integers, into an array first.
  if (entMainData.listInput) {
    let listInputArr = entMainData.listInput.split('|').map(list => (
      list.split(',')
    ));
    substitutePlaceholders(mainProps, /%l[0-9]/g, placeholder => {
      let n = parseInt(placeholder.substring(2));
      return listInputArr[n] ?? "@null";
    });
  }

  // Replace all /%s[0-9]/ placeholders in the values of the template by the
  // string inputs, separated by '|'.
  if (entMainData.strInput) {
    let strInputArr = getStrInputArr(entMainData.strInput);
    substitutePlaceholders(mainProps, /%s[0-9]/g, placeholder => {
      let n = parseInt(placeholder.substring(2));
      return strInputArr[n] ?? "@null";
    });
    // Also Replace any /%s/ placeholders in the values of the template by the
    // whole string input. 
    let strInput = entMainData.strInput;
    substitutePlaceholders(mainProps, /%s/g, () => strInput);
  }

  // Finally copy the object's own property struct into the template. 
  entMainData.mainProps = Object.assign(mainProps, entMainData.ownStruct);

  // Then call the callback function and return.
  callback(entMainData);
  return;
}


export function substitutePlaceholders(mainProps, regex, substituteFun) {
  Object.keys(mainProps).forEach(propKey => {
    let propVal = mainProps[propKey];
    mainProps[propKey] = propVal.replaceAll(regex, substituteFun);
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
