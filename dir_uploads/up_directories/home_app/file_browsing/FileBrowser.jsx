
import {split, indexOf, toString, slice as sliceStr} from 'string';
import {some, slice as sliceArr, at, join, map, concat} from 'array';
import {parseRoute, isTextFileExtension} from 'route';

import * as ILink from 'ILink.jsx'; 





// getInitState() parses the input route, and in the special case where the
// route includes only directories, it reinterprets the route by adding a ';'
// right after the homeDirID, which casts the "/<upNodeID>/<homeDirID>" result
// into a list of children of the specific subdirectory pointed to by route.
export function getInitState({route: extRoute}) {
  if (at(extRoute, -1) === "/") extRoute = sliceStr(extRoute, 0, -1);
  // Parse and the (extended) route.
  let [route, ...castingSegments] = split(extRoute, ";");
  let isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr;
  try {
    [
      isLocked, upNodeID, homeDirID, filePath, fileExt, queryPathArr
    ] = parseRoute(route);
  }
  catch {
    return {isInvalid: true}
  }

  // Calculate the home path of the route.
  let routeHomePath = homeDirID ? "/" + upNodeID + "/" + homeDirID : undefined;

  // If there is no filePath or casting segments, record that route is a
  // "directory path."
  let isDirectoryPath = (!filePath && castingSegments.length === 0);

  // If if it is a directory path, reinterpret the route by putting a ';' after
  // the homeDirID, which means that the route becomes a casted as a
  // subdirectory route.
  let transformedRoute = route;
  if (isDirectoryPath) {
    let subdirectoryPath = join(queryPathArr, "/");
    transformedRoute = routeHomePath + ";/" + subdirectoryPath;
  }

  // Also record if the route is a query to a text file, e.g. a "/call" or
  // "/get" route.
  let isTextFileQuery = fileExt && isTextFileExtension(fileExt) &&
    queryPathArr?.length > 0;

  // Then call getRouteJSXWithSubLinks() to get a <span> element with the route
  // where every single queryable segment is an individual ILink, meaning that
  // the user can navigate to ancestor directories, or to pre-casted versions
  // of a casted route.
  let routeJSXWithSubLinks = getRouteJSXWithSubLinks(
    castingSegments, routeHomePath, filePath, isTextFile, queryPathArr
  );

  return {
    isLocked: isLocked, routeHomePath: routeHomePath, filePath: filePath,
    transformedRoute: transformedRoute, isDirectoryPath: isDirectoryPath,
    isTextFileQuery: isTextFileQuery,
    routeJSXWithSubLinks: routeJSXWithSubLinks,
  };
} 




function getRouteJSXWithSubLinks(
  castingSegments, routeHomePath, filePath, isTextFile, queryPathArr
) {
  // If there is no filePath, interpret queryPathArr as an array of
  // subdirectories, and else parse the subdirectories and file name from
  // filePath.
  let directorySegments, fileName;
  if (!filePath) {
    directorySegments = queryPathArr;
  }
  else {
    let pathSegments = split(filePath, "/");
    directorySegments = sliceArr(pathSegments, 0, -1);
    fileName = at(pathSegments, -1);
  }

  // Initialize an accumulative path for the following ILinks.
  let acc = "/f" + routeHomePath;

  // Create an ILink to the home directory.
  let homeILink = <ILink key="h" href={acc}>{routeHomePath}</ILink>

  // Then create an array of ILinks to each additional subdirectory, if any.
  let subdirectoryLinks = directorySegments.map((val, ind) => {
    acc += "/" + val;
    return <ILink key={"s" + ind} href={acc}>{val}</ILink>
  });

  // Also create an ILinks to the file if the file is a text file and the
  // queryPathArr is nonempty.
  let fileLink = (isTextFile && queryPathArr.length > 0) ?
    <ILink key={"f"} href={acc + "/" + fileName}>{fileName}</ILink> :
    undefined;
  
  // Then create an ILink to the result as it is before any casting.
  let resultLink = <ILink key={"f"} href={
    acc + "/" + fileName + (
      queryPathArr.length === 0 ? "" : join(queryPathArr, "/")
    )
  }>{"....."}</ILink>;

  // ...
}




export function render({route}) {
  if (at(route, -1) === "/") route = sliceStr(route, 0, -1);
  let {
    isInvalid, isMissing, isLocked, routeHomePath, filePath,
    transformedRoute, isDirectoryPath, isTextFileQuery, routeJSXWithSubLinks,
    adminID, fileText, result
  } = this.state;
  let content;


  if (isLocked || isInvalid || !routeHomePath) {
    content = <div className="invalid-route"></div>;
  }
  else if (isMissing) {
    content = <div className="missing"></div>;
  }

  // Before any fetches has been made, fetch the admin ID, the result pointed
  // to by the route, and potentially the text file content as well if the
  // route is a path to a text file plus a query path.
  else if (adminID === undefined) {
    this.setState(state => ({...state, adminID: false}));
    fetch(routeHomePath + "/admin").then(adminID => {
      this.setState({...this.state, adminID: adminID ? adminID : "None"});
    });
    fetch(transformedRoute).then(result => {
      this.setState({...this.state, result: result});
    });
    if (isTextFileQuery) {
      fetch(routeHomePath + "/" + filePath).then(text => {
        this.setState({...this.state, fileText: text});
      });
    }
    content = <div className="fetching"></div>;
  }

  else if (
    !adminID || result === undefined ||
    isTextFileQuery && fileText === undefined
  ) {
    content = <div className="fetching"></div>;
  }

  else {
    // Break up the result into lines with line numbers in front, unless the
    // route is a directory route, in which case let each line be an ILink
    // to the given child of the directory.
    let transformedResult = isDirectoryPath ?
      (result ?? []).map(child => <div>
        <ILink key={"child" + ind} href={route + "/" + child}>{child}</ILink> 
      </div>) :
      split(toString(result), "\n").map((line, ind) => (
        <div className="line">{ind + 1}{": "}{line}</div>
      ));
    
    // And in case of a text file query, break up the fileText into individual
    // lines with line numbers in front.
    let brokenUpText = isTextFileQuery ? split(
      toString(fileText), "\n"
    ).map((line, ind) => (
      <div className="line">{ind + 1}{": "}{line}</div>
    )) : undefined;

    // Then construct the final content.
    content = [
      <div className="admin-id">{"Admin ID: "}{adminID}</div>,
      <div className="result">
        {"Result: "}{<br/>}
        <div>{transformedResult}</div>
      </div>,
      !isTextFileQuery ? undefined : <div className="text-file-content">
        {"Text file: "}{<br/>}
        <div>{brokenUpText}</div>
      </div>,
    ];
  }

  return (
    <div className="file-browser">
      <div className="route">{routeJSXWithSubLinks}</div>
      {content}
    </div>
  );
}


