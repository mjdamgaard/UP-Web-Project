
import {
  payGas, RuntimeError,
} from "../../../../interpreting/ScriptInterpreter.js";

const LOCKED_ROUTE_REGEX = /~/;


export async function query(
  {callerNode, execEnv, interpreter},
  route, isPost, _, options,
  upNodeID, homeDirID, filePath, _, queryPathArr
) {
  let {dbQueryHandler} = interpreter;

  // If route equals ".../mkdir/a=<adminID>", create a new home directory with
  // the requested adminID as the admin. 
  if (!homeDirID) {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    if (queryPathArr[0] === "mkdir") {
      let [a, adminID] = (queryPathArr[1] ?? []);
      if (a !== "a" || !adminID) throw new RuntimeError(
        "No admin ID was provided",
        callerNode, execEnv
      );
      payGas(callerNode, execEnv, {mkdir: 1});
      return await dbQueryHandler.queryDBProc(
        "createHomeDir", [adminID],
        route, upNodeID, options, callerNode, execEnv,
      );
    }
    else throw new RuntimeError(
      `Unrecognized route: ${route}`,
      callerNode, execEnv
    );
  }

  // No requests targeting subdirectories are implemented at this point.
  if (filePath) throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );

  // If route equals just ".../<homeDirID>", without any query path, return
  // a list of all nested file paths of the home directory, except paths of
  // files nested inside locked subdirectories (which includes a "~").
  if (!queryPathArr) {
    let fullDescList = await dbQueryHandler.queryDBProc(
      "readHomeDirDescendants", [homeDirID, 4000, 0],
      route, upNodeID, options, callerNode, execEnv,
    );
    let visibleDescList = (fullDescList ?? []).filter(([filePath]) => (
      !LOCKED_ROUTE_REGEX.test(filePath)
    ));
    return visibleDescList;
  }

  let queryType = queryPathArr[0];

  // If route equals just ".../<homeDirID>/_all", return a list of all nested
  // file paths of the home directory.
  if (queryType === "~all") {
    return await dbQueryHandler.queryDBProc(
      "readHomeDirDescendants", [homeDirID, 4000, 0],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals just ".../<homeDirID>/admin", return the adminID of the
  // home directory.
  if (queryType === "admin") {
    return await dbQueryHandler.queryDBProc(
      "readHomeDirAdminID", [homeDirID],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/_setAdmin/a=<adminID>", set a new admin
  // of the home directory.
  if (queryType === "~setAdmin") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let [a, adminID] = (queryPathArr[1] ?? []);
    if (a !== "a" || !adminID) throw new RuntimeError(
      "No admin ID was provided",
      callerNode, execEnv
    );
    return await dbQueryHandler.queryDBProc(
      "editHomeDir", [homeDirID, requestedAdminID],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/~delete", request a deletion of the
  // directory, but note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "~delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    return await dbQueryHandler.queryDBProc(
      "deleteHomeDir", [homeDirID],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // TODO: Implement /readGas, /depositGas, and /withdrawGas routes, the latter
  // two of which are locked, which reads and writes to a gas JSON object in
  // the DB, indexed by the homeDirID as well, as an arbitrarily chosen "gas
  // account ID" (meaning that an SM can choose to store its gas on several
  // separate accounts (used for different things)). When a SMF (or an admin)
  // queries these routes, the gas amounts are automatically added or removed
  // from the live gas object (in scriptVars). This system will then afford a
  // way for users to be able to pool gas together for costly computations or
  // other actions. 

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
