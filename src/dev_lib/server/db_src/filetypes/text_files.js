
import {MainDBConnection} from "./DBConnection.js";
import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function fetch(
  execVars,
  route, homeDirID, filePath, fileExt, queryStringArr,
  cachePeriod = undefined, clientCacheTime = undefined
) {
  let {callerNode, callerEnv, execEnv, interpreter} = execVars;

  // If route equals just "/<homeDirID>/<filePath>", without any query string,
  // return the text stored in the file.
  if (!queryStringArr) {
    // TODO: Look in the cache first.
    let [text] = await readTextFile(gas, homeDirID, filePath);
    return [text];
  }

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>/<filePath>?_get&<alias>", verify that
  // fileExt = "js", and if so, execute the module and return the variables
  // exported as <alias>. 
  if (queryType === "get") {
    // TODO: Implement, and make sure to also remove any elevated privileges
    // when executing the module.
  }

  // If route equals "/<homeDirID>/<filePath>?_call&<alias>&<inputArr", verify
  // that fileExt = "js", and if so, execute the module and get the function
  // exported as <alias>, then call it and return its output.
  if (queryType === "call") {
    // TODO: Implement, and make sure to also remove any elevated privileges
    // when executing the module and calling the function.
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );
}



export async function post(
  execVars,
  route, homeDirID, filePath, fileExt, queryStringArr,
  cachePeriod = undefined, clientCacheTime = undefined
) {
  let {callerNode, callerEnv, execEnv, interpreter} = execVars;

  // If route equals just "/<homeDirID>/<filePath>", without any query string,
  // return the text stored in the file.
  if (!queryStringArr) {
    let [text] = await readTextFile(gas, homeDirID, filePath);
    return [text];
  }

  let queryType = queryStringArr[0];

  // If route equals "/<homeDirID>?_put&<contentText>", overwrite the existing
  // file with contentText, if any, or create a new file with that content.
  if (queryType === "_put") {
    let contentText = queryStringArr[1] ?? "";
    let wasCreated = await putTextFile(
      execVars, homeDirID, filePath, contentText
    );
    return [wasCreated];
  }

  // If route equals "/<homeDirID>/<filePath>?_delete", ...
  if (queryType === "_delete") {
    // ...
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route for the "fetch" method: ${route}`,
    callerNode, callerEnv
  );
}


export async function readTextFile(
  {callerNode, callerEnv}, homeDirID, filePath
) {
  payGas(callerNode, callerEnv, {dbRead: 1});
  let text = await MainDBConnection.querySingleValue(
    "readTextFile", [homeDirID, filePath]
  );
  return [text];
} 

