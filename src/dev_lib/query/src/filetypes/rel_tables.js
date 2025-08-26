

import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";
import {DBQueryHandler} from "../../../../server/db_io/DBQueryHandler.js";

const dbQueryHandler = new DBQueryHandler();


export async function query(
  {callerNode, execEnv},
  route, isPost, postData, options,
  homeDirID, filePath, fileExt, queryPathArr,
) {

  // If route equals just ".../<homeDirID>/<filePath>", without any query
  // path, throw.
  if (!queryPathArr) throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );

  let queryType = queryPathArr[0];

  // If route equals ".../<homeDirID>/<filepath>/_touch" create a table file
  // if not already there, but do not delete its content if there.
  if (queryType === "_touch") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    payGas(callerNode, execEnv, {dbWrite: 1});
    let [[wasCreated] = []] = await dbQueryHandler.queryDBProc(
      "touchTableFile", [homeDirID, filePath],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasCreated;
  }

  // If route equals ".../<homeDirID>/<filepath>/_put" create a table file
  // if not already there, and delete its content if it does exist already.
  if (queryType === "_put") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    payGas(callerNode, execEnv, {dbWrite: 1});
    let procName =
      (fileExt === "att") ? "putATT" :
      (fileExt === "bt") ? "putBT" :
      (fileExt === "ct") ? "putCT" :
      (fileExt === "bbt") ? "putBBT" :
      undefined;
    let [[wasCreated] = []] = await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasCreated;
  }


  // If route equals ".../<homeDirID>/<filepath>/_rm", delete the table file
  // (and its content) if its there.
  if (queryType === "_rm") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let procName =
      (fileExt === "att") ? "deleteATT" :
      (fileExt === "bt") ? "deleteBT" :
      (fileExt === "ct") ? "deleteCT" :
      (fileExt === "bbt") ? "deleteBBT" :
      undefined;
    let [[wasDeleted] = []] = await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasDeleted;
  }


  // If route equals ".../<homeDirID>/<filepath>/_deleteEntry[/l=<listID>]" +
  // "/k=<elemKey>", delete a single table entry with that primary key, where
  // the default value for listID is "".
  if (queryType === "_deleteEntry") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let procName =
      (fileExt === "att") ? "deleteATTEntry" :
      (fileExt === "bt") ? "deleteBTEntry" :
      (fileExt === "ct") ? "deleteCTEntry" :
      (fileExt === "bbt") ? "deleteBBTEntry" :
      undefined;
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    let {l: listID = "", k: elemKey = ""} = paramObj;
    let [[wasDeleted] = []] = await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath, listID, elemKey],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasDeleted;
  }

  // If route equals ".../<homeDirID>/<filepath>/_deleteList[/l=<listID>]" +
  // "[/lo=<loElemKey>]"[/hi=<hiElemKey>]", delete all entries with elemKeys
  // between lo and hi. The default value for lo is "", and if hi is missing,
  // all entries are deleted with an elemKey >= lo.
  if (queryType === "_deleteList") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let procName =
      (fileExt === "att") ? "deleteATTList" :
      (fileExt === "bt") ? "deleteBTList" :
      (fileExt === "ct") ? "deleteCTList" :
      (fileExt === "bbt") ? "deleteBBTList" :
      undefined;
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    // TODO: Verify that hi === undefined makes it NULL when inserted in the
    // SQL (and otherwise perhaps use a hack of using a non-hex string).
    let {l: listID = "", lo: lo = "", hi: hi} = paramObj;
    let [[wasDeleted] = []] = await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath, listID, lo, hi],
      route, options, callerNode, execEnv,
    ) ?? [];
    return wasDeleted;
  }

  // If route equals ".../<homeDirID>/<filepath>/entry[/l=<listID>]" +
  // "/k=<elemKey>", read and return the table entry with the given list ID and
  // element key. Note that for binary and UTF-8 keys, listID and elemKey
  // should be hex-encoded.
  if (queryType === "entry") {
    payGas(callerNode, execEnv, {dbRead: 1});
    let procName =
      (fileExt === "att") ? "readATTEntry" :
      (fileExt === "bt") ? "readBTEntry" :
      (fileExt === "ct") ? "readCTEntry" :
      (fileExt === "bbt") ? "readBBTEntry" :
      undefined;
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    let {l: listID = "", k: elemKey = ""} = paramObj;
    let [resultRow] = await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath, listID, elemKey],
      route, options, callerNode, execEnv,
    ) ?? [];
    return resultRow;
  }

  // If route equals ".../<homeDirID>/<filepath>/list[/l=<listID][/lo=<lo>]" +
  // "[/hi=<hi>][/o=<numOffset>]/n=<maxNum>/a=<isAscending>", read and return
  // the primary-key-indexed list where the elemKey is limited by lo and hi if
  // any of them are provided, and limited by a maximum number of naxNum
  // entries, and offset by numOffset.
  if (queryType === "list") {
    let procName =
      (fileExt === "att") ? "readATTList" :
      (fileExt === "bt") ? "readBTList" :
      (fileExt === "ct") ? "readCTList" :
      (fileExt === "bbt") ? "readBBTKeyOrderedList" :
      undefined;
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    let {
      l: listID = "", lo = "", hi, n: maxNum, o: numOffset = 0,
      a: isAscending
    } = paramObj;
    maxNum = parseInt(maxNum);
    isAscending = parseInt(isAscending);
    if (Number.isNaN(maxNum) || Number.isNaN(isAscending)) {
      throw new RuntimeError(
        `Invalid query path for a list query: ${route}`,
        callerNode, execEnv
      );
    }
    payGas(callerNode, execEnv, {dbRead: maxNum / 100});
    return await dbQueryHandler.queryDBProc(
      procName,
      [homeDirID, filePath, listID, lo, hi, maxNum, numOffset, isAscending],
      route, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filepath>/skList[/lo=<lo>][/hi=<hi>]" +
  // "[/o=<numOffset>]n=<maxNum>[/a=<isAscending>]", verify the the file type
  // is a '.bbt' file, and then read and return a list where entries are
  // ordered by their elemScore instead, i.e. by their secondary key (SK).
  if (queryType === "skList") {
    if (fileExt !== "bbt") throw new RuntimeError(
      "Secondary index lists are only implemented for the '.bbt' file type",
      callerNode, execEnv
    );
    let procName = "readBBTScoreOrderedList";
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    let {
      l: listID = "", lo = "", hi, n: maxNum, o: numOffset = 0,
      a: isAscending = 0
    } = paramObj;
    maxNum = parseInt(maxNum);
    isAscending = parseInt(isAscending);
    if (Number.isNaN(maxNum) || Number.isNaN(isAscending)) {
      throw new RuntimeError(
        `Invalid query path for a list query: ${route}`,
        callerNode, execEnv
      );
    }
    payGas(callerNode, execEnv, {dbRead: maxNum / 100});
    return await dbQueryHandler.queryDBProc(
      procName,
      [homeDirID, filePath, listID, lo, hi, maxNum, numOffset, isAscending],
      route, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filepath>/_insert/[/l=<listID>]" +
  // "[/k=<elemKey>][/s=<elemScore>][/p=<elemPayload>][/o=<overwrite>]", insert
  // a single table entry with those row values, ignoring any existing entry
  // of the same key, unless the overwrite parameter (o) is defined and truthy.
  // This does not apply .att files, but for these, if elemKey is defined and
  // not the empty string, the entry will be overwritten if one already exist.
  if (queryType === "_insert") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let procName =
      (fileExt === "att") ? "insertATTEntry" :
      (fileExt === "bt") ? "insertBTEntry" :
      (fileExt === "ct") ? "insertCTEntry" :
      (fileExt === "bbt") ? "insertBBTEntry" :
      undefined;
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    let {
      l: listID = "", k: elemKey = "", s: elemScore = "", p: elemPayload = "",
      o: overwrite = 1,
    } = paramObj;
    overwrite = overwrite ? 1 : 0;
    if (postData) {
      elemPayload = postData;
    }
    let rowLen = listID.length + elemKey.length + elemScore.length +
      elemPayload.length;
    payGas(callerNode, execEnv, {dbWrite: rowLen});
    let paramValArr = (fileExt === "bbt") ?
      [homeDirID, filePath, listID, elemKey, elemScore, elemPayload, overwrite]
      : (fileExt === "att") ?
        [homeDirID, filePath, listID, elemKey, elemPayload] :
        [homeDirID, filePath, listID, elemKey, elemPayload, overwrite];
    let [[wasUpdatedOrNewID] = []] = await dbQueryHandler.queryDBProc(
      procName, paramValArr, route, options, callerNode, execEnv,
    ) ?? [];
    return wasUpdatedOrNewID;
  }

  // If route equals ".../<homeDirID>/<filepath>/_insertList[/l=<listID>]" +
  // "[/o=<overwrite>]", treat postData as an array of rows to insert into the
  // table. The overwrite parameter also determines whether to ignore on
  // duplicate keys or to overwrite. For .att files, if overwrite is true, the
  // the rows of rowArr should have the form '\[<textID>,<textJSONStr>\]'. And
  // for the .bt, .ct, and .bbt files, the form should be '\[<elemKeyHex>,' +
  // '[<elemScoreHex>,][<elemPayloadHex>]\]', but where elemScoreHex should of
  // course only be present in the case of a .bbt file. 
  if (queryType === "_insertList") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let rowArr, isValid = true;
    if (postData) {
      try {
        rowArr = JSON.parse(postData);
      } catch (err) {
        isValid = false;
      }
      if (!(rowArr instanceof Array)) {
        isValid = false;
      }
    }
    else throw new RuntimeError(
      "No JSON array provided",
      callerNode, execEnv
    );
    if (!isValid) throw new RuntimeError(
        "Invalid JSON array",
        callerNode, execEnv
      );
    let procName =
      (fileExt === "att") ? "insertATTList" :
      (fileExt === "bt") ? "insertBTList" :
      (fileExt === "ct") ? "insertCTList" :
      (fileExt === "bbt") ? "insertBBTList" :
      undefined;
    let paramObj;
    try {
      paramObj = Object.fromEntries(queryPathArr.slice(1));
    }
    catch (err) {
      throw new RuntimeError(
        `Invalid query path: ${route}`,
        callerNode, execEnv
      );
    }
    let {l: listID = "", o: overwrite = 1} = paramObj;
    overwrite = overwrite ? 1 : 0;
    payGas(callerNode, execEnv, {dbWrite: postData.length});
    let paramValArr = [homeDirID, filePath, listID, postData, overwrite];
    let [[rowCount] = []] = await dbQueryHandler.queryDBProc(
      procName, paramValArr, route, options, callerNode, execEnv,
    ) ?? [];
    return rowCount
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
