
import {
  DevFunction, PromiseObject, ObjectObject,
} from "../../interpreting/ScriptInterpreter.js";



// getSequentialPromise(callbackArr, input?) takes and array of callbacks
// returning promises and calls then one at a time, and only after the the
// previous promise has resolved. The result of each promise is passed as the
// argument of the next callback in the line, and the first callback is given
// the optional 'input' parameter as its argument. If a callback returns
// anything other than a promise, then we just skip to the next callback, and
// pass it the returned value as its input. Finally, the result of the last
// promise it returned. 
export const getSequentialPromise = new DevFunction(
  "getSequentialPromise", {isAsync: true, typeArr: ["array", "any?"]},
  async ({callerNode, execEnv, interpreter}, [callbackArr, input]) => {
    if (callbackArr instanceof ObjectObject) callbackArr = callbackArr.members;

    let len = callbackArr.length;
    for (let i=0; i<len; i++) {
      let callback = callbackArr[i];
      let promiseObj = interpreter.executeFunction(
        callback, [input], callerNode, execEnv
      );
      if (!(promiseObj instanceof PromiseObject)) {
        input = promiseObj;
      }
      else {
        input = await promiseObj.promise;
      }
    }

    // Return the result of the last promise in the sequence.
    return input;
  }
);
