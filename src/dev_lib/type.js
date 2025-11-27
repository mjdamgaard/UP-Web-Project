
import {
  DevFunction, ObjectObject, ArgTypeError,
  verifyType as _verifyType, verifyTypes as _verifyTypes,
} from '../interpreting/ScriptInterpreter.js';



export const verifyType = new DevFunction(
  "verifyType", {typeArr: ["any?", "string", "boolean?"]},
  ({callerNode, execEnv}, [val, type, isOptional]) => {
    if (type.at(-1) === "?") {
      type = type.slice(0, -1);
      isOptional = true;
    }
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



export const hasType = new DevFunction(
  "hasType", {typeArr: ["any?", "string", "boolean?"]},
  ({callerNode, execEnv}, [val, type, isOptional]) => {
    if (type.at(-1) === "?") {
      type = type.slice(0, -1);
      isOptional = true;
    }
    try {
      _verifyType(val, type, isOptional, callerNode, execEnv);
      return true;
    } catch (err) {
      if (err instanceof ArgTypeError) {
        return false;
      }
      else throw err;
    }
  },
);