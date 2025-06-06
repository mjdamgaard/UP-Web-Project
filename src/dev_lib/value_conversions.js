
import {
  DevFunction, TypeError, getArray,
} from '../../interpreting/ScriptInterpreter.js';




export const arrayToBase64 = new DevFunction(
  {},
  function(
    {callerNode, execEnv},
    [valArr, typeArr]
  ) {
    valArr = getArray(valArr);
    typeArr = getArray(typeArr);
    if (valArr === undefined || typeArr === undefined) throw new TypeError(
      "arrayToBase64(): Invalid input arrays",
      callerNode, execEnv
    );
    let ret = "";
    typeArr.forEach(type => {

    });
  }
);
