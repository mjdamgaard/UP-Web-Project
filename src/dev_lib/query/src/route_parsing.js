
const lockedRouteRegex = /\/_/;

const hexIDRegEx = /^[0-9a-f]+$/;
const dirSegmentRegEx = /^\.*[a-zA-Z0-9_\-]+$/;
const fileNameRegEx =
  /^\.*[a-zA-Z0-9_\-]+\.([a-zA-Z0-9_\-]+\.)*([a-zA-Z0-9_\-]+)$/;
const queryPathSegmentRegEx = /^([.~a-zA-Z0-9_\-]|%[0-9A-F]{2})*$/;



export function parseRoute(route) {
  // First check whether the route is locked or not (i.e. if it has any path
  // or query path segment that starts with an underscore).
  let isLocked = lockedRouteRegex.test(route);

  // Then split the route along the first occurrence of "//", into the path
  // and the query path.
  let indOfFirstDblSlash = route.indexOf("//");
  let path, queryPath;
  if (indOfFirstDblSlash === -1) {
    path = route;
  }
  else {
    path = route.substring(0, indOfFirstDblSlash);
    queryPath = route.substring(indOfFirstDblSlash + 2);
  }

  // And split these two parts further along all occurrences of "/".
  if (path && path[0] !== "/") throw (
    `Invalid route: ${route}`
  );
  let pathSegments = path ? path.substring(1).split("/") : [];
  let queryPathSegments = queryPath ? queryPath.split("/") : [];

  // Parse and validate the upNodeID and homeDirID, if any, from path.
  let upNodeID = pathSegments[0];
  if (upNodeID !== undefined && !hexIDRegEx.test(upNodeID)) throw (
    `Invalid route: ${route}`
  );
  let homeDirID = pathSegments[1];
  if (homeDirID !== undefined && !hexIDRegEx.test(homeDirID)) throw (
    `Invalid route: ${route}`
  );

  // Extract the last path segment and see if it is a file name (with a dot
  // somewhere in the middle). And record fileExt and fileName in the process.
  let lastPathSegment = pathSegments.at(-1);
  let [match, , fileExt] = fileNameRegEx.exec(lastPathSegment) ?? [];
  let isFilePath = match ? true : false;
  let fileName = isFilePath ? lastPathSegment : undefined;

  // Parse and validate the directory segments, if any.
  let dirSegments = pathSegments.slice(2, isFilePath ? -1 : undefined);
  dirSegments.forEach(segment => {
    if (!dirSegmentRegEx.test(segment)) throw (
      `Invalid route: ${route}`
    );
  });

  // Then validate the query path segments, if any.
  queryPathSegments.forEach(segment => {
    if (!queryPathSegmentRegEx.test(segment)) throw (
      `Invalid route: ${route}`
    );
  });

  // And finally, on success, return the parsed values and arrays, including a
  // localPath value constructed from the dirSegments and the fileName.
  let localPath = dirSegments.join("/");
  localPath = localPath ? localPath + (isFilePath ? "/" + fileName : "") :
    (isFilePath ? fileName : "");
  return [
    isLocked, upNodeID, homeDirID, localPath, dirSegments, fileName, fileExt,
    queryPathSegments
  ];
}



// getQueryObject() takes an array of the form [(key, value,)*], and returns
// and object of the form {(key: value,)*}.
export function getQueryObject(concatenatedKeyValueArray) {
  let ret = {};
  let len = concatenatedKeyValueArray.length;
  for (let i = 0; i < len; i = i + 2) {
    ret[concatenatedKeyValueArray[i]] = concatenatedKeyValueArray[i + 1];
  }
  return ret;
}
