
import {
  payGas, RuntimeError,
} from "../../../../interpreting/ScriptInterpreter.js";

const LOCKED_ROUTE_REGEX = /\/_/;


export async function query(
  {callerNode, execEnv, interpreter},
  route, isPost, _postData, options,
  upNodeID, homeDirID, filePath, _fileExt, queryPathArr
) {
  let {dbQueryHandler} = interpreter;

  // If route equals ".../mkdir/[a=<adminID>]", create a new home directory
  // with the requested adminID as the admin, or with the requesting user as
  // the admin if n adminID is provided. 
  if (!homeDirID) {
    if (queryPathArr[0] === "mkdir") {
      if (!isPost) throw new RuntimeError(
        `Unrecognized route for GET-like requests: "${route}"`,
        callerNode, execEnv
      );
      let [a, adminID] = (queryPathArr[1] ?? []);
      if (a === "") {
        if (!adminID) throw new RuntimeError(
          "No admin ID was provided",
          callerNode, execEnv
        );
      } else {
        adminID = execEnv.scriptVars.contexts.userIDContext.get();
      }
      payGas(callerNode, execEnv, {mkdir: 1});
      let [[dirID] = []] = await dbQueryHandler.queryDBProc(
        "createHomeDir", [adminID],
        route, upNodeID, options, callerNode, execEnv,
      ) ?? [];
      return dirID;
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
  // files nested inside locked subdirectories (with any leading underscores).
  if (!queryPathArr) {
    let filePathTable = await dbQueryHandler.queryDBProc(
      "readHomeDirDescendants", [homeDirID, 4000, 0],
      route, upNodeID, options, callerNode, execEnv,
    ) ?? [];
    return filePathTable.map(([filePath]) => filePath)
      .filter((filePath) => (!LOCKED_ROUTE_REGEX.test(filePath)));
  }

  let queryType = queryPathArr[0];

  // If route equals just ".../<homeDirID>/_all", return a list of all nested
  // file paths of the home directory.
  if (queryType === "_all") {
    let filePathTable = await dbQueryHandler.queryDBProc(
      "readHomeDirDescendants", [homeDirID, 4000, 0],
      route, upNodeID, options, callerNode, execEnv,
    ) ?? [];
    return filePathTable.map(([filePath]) => filePath);
  }

  // If route equals just ".../<homeDirID>/admin", return the adminID of the
  // home directory.
  if (queryType === "admin") {
    let [[adminID] = []] = await dbQueryHandler.queryDBProc(
      "readHomeDirAdminID", [homeDirID],
      route, upNodeID, options, callerNode, execEnv,
    ) ?? [];
    return adminID;
  }

  // If route equals ".../<homeDirID>/_setAdmin/a=<adminID>", set a new admin
  // of the home directory.
  if (queryType === "_setAdmin") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let [a, adminID] = (queryPathArr[1] ?? []);
    if (a !== "a" || !adminID) throw new RuntimeError(
      "No admin ID was provided",
      callerNode, execEnv
    );
    let [[wasEdited] = []] = await dbQueryHandler.queryDBProc(
      "editHomeDir", [homeDirID, adminID],
      route, upNodeID, options, callerNode, execEnv,
    ) ?? [];
    return wasEdited;
  }

  // If route equals ".../<homeDirID>/_delete", request a deletion of the
  // directory, but note that directories can only be deleted after each nested
  // file in it has been deleted (as this query does not delete the files).
  if (queryType === "_delete") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let [[wasDeleted] = []] = await dbQueryHandler.queryDBProc(
      "deleteHomeDir", [homeDirID],
      route, upNodeID, options, callerNode, execEnv,
    ) ?? [];
    return wasDeleted;
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
