

import {
  RuntimeError, payGas,
} from "../../../../interpreting/ScriptInterpreter.js";


export async function query(
  {callerNode, execEnv, interpreter},
  route, isPost, postData, options,
  upNodeID, homeDirID, filePath, fileExt, queryPathArr,
) {
  let {dbQueryHandler} = interpreter;

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
    return await dbQueryHandler.queryDBProc(
      "touchTableFile", [homeDirID, filePath],
      route, upNodeID, options, callerNode, execEnv,
    );
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
    return await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath],
      route, upNodeID, options, callerNode, execEnv,
    );
  }


  // If route equals ".../<homeDirID>/<filepath>/_delete", delete the table
  // file (and its content) if its there.
  if (queryType === "_delete") {
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
    return await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath],
      route, upNodeID, options, callerNode, execEnv,
    );
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
    return await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath, listID, elemKey],
      route, upNodeID, options, callerNode, execEnv,
    );
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
    // SQL (and otherwise perhaps use a hack of using a non-base-64 string).
    let {l: listID = "", lo: lo = "", hi: hi} = paramObj;
    return await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath, listID, lo, hi],
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filepath>/entry[/l=<listID>]" +
  // "/k=<elemKey>", read and return the table entry with the given list ID and
  // element key. Note that for binary and UTF-8 keys, listID and elemKey
  // should be base-64-encoded.
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
    return await dbQueryHandler.queryDBProc(
      procName, [homeDirID, filePath, listID, elemKey],
      route, upNodeID, options, callerNode, execEnv,
    );
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
      route, upNodeID, options, callerNode, execEnv,
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
      route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filepath>/_insert/[/l=<listID>]" +
  // "k=<elemKey>[/s=<elemScore>][/p=<elemPayload>][/i=<ignore]", insert a
  // single table entry with those row values, overwriting any existing entry
  // of the same key, unless ignore (i) is defined and truthy (does not apply
  // .att files).
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
      i: ignore = 0,
    } = paramObj;
    ignore = parseInt(ignore);
    if (Number.isNaN(ignore)) throw new RuntimeError(
      `Invalid query path for am insert query: ${route}`,
      callerNode, execEnv
    );
    if (postData) {
      elemPayload = postData;
    }
    let rowLen = listID.length + elemKey.length + elemScore.length +
      elemPayload.length;
    payGas(callerNode, execEnv, {dbWrite: rowLen});
    let paramValArr = (fileExt === "bbt") ?
      [homeDirID, filePath, listID, elemKey, elemScore, elemPayload, ignore] :
      (fileExt === "att") ?
        [homeDirID, filePath, listID, elemKey, elemPayload] :
        [homeDirID, filePath, listID, elemKey, elemPayload, ignore];
    return await dbQueryHandler.queryDBProc(
      procName, paramValArr, route, upNodeID, options, callerNode, execEnv,
    );
  }

  // If route equals ".../<homeDirID>/<filepath>/_insertList[/l=<listID>]" +
  // "[/i=<ignore>]", treat postData as an array of rows to insert into the
  // table. The ignore parameter also determines whether to ignore on duplicate
  // keys or to overwrite.
  if (queryType === "_insertList") {
    if (!isPost) throw new RuntimeError(
      `Unrecognized route for GET-like requests: "${route}"`,
      callerNode, execEnv
    );
    let rowArr;
    if (postData) {
      try {
        rowArr = JSON.parse(postData);
      } catch (err) {
        throw new RuntimeError(
          "Invalid gas JSON object",
          callerNode, execEnv
        );
      }
    }
    else throw new RuntimeError(
      "No requested gas JSON object provided",
      callerNode, execEnv
    );
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
    let {l: listID = "", i: ignore = false} = paramObj;
    // TODO: Continue. (The plan is to generate one big INSERT statement from
    // the )
  }

  // If the route was not matched at this point, throw an error.
  throw new RuntimeError(
    `Unrecognized route: ${route}`,
    callerNode, execEnv
  );
}
