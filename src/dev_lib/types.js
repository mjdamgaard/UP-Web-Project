
import {
  DevFunction, ObjectObject,
  verifyType as _verifyType, verifyTypes as _verifyTypes,
} from '../interpreting/ScriptInterpreter.js';



export const verifyType = new DevFunction(
  "verifyType", {typeArr: ["any", "string", "boolean?"]},
  ({callerNode, execEnv}, [val, type, isOptional]) => {
    return _verifyType(val, type, isOptional, callerNode, execEnv);
  },
);

export const verifyTypes = new DevFunction(
  "verifyTypes", {typeArr: ["array", "array"]},
  ({callerNode, execEnv}, [valArr, typeArr]) => {
    if (valArr instanceof ObjectObject) valArr = valArr.members;
    if (typeArr instanceof ObjectObject) typeArr = typeArr.members;
    return _verifyTypes(valArr, typeArr, callerNode, execEnv);
  },
);
