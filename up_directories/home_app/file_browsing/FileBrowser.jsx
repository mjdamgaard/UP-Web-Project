
import {
  split, at as atStr, toString, slice as sliceStr, indexOf
} from 'string';
import {slice as sliceArr, at as atArr, join, map} from 'array';
import {parseRoute, isTextFileExtension} from 'route';
import {hasType} from 'type';
import {fetch, encodeURI} from 'query';
import {getUserEntPath, postEntity} from "/1/1/entities.js";

import * as ILink from 'ILink.jsx';
import * as EntityReference from "../misc/EntityReference.jsx";
import * as TextDisplay from "../misc/TextDisplay.jsx";


// TODO: There is an error in how I handle paths to subdirectories, where I
// query the server for the sub-directory route, instead of querying the home
// path and just filtering the list. So fix this.

// TODO: Refactor this component now that parseRoute() produces dirSegments and
// fileName as well.



// initialize() parses the input route, and in the special case where the
// route includes only directories, it reinterprets the route by adding a ';'
// right after the homeDirID, which casts the "/<upNodeID>/<homeDirID>" result
// into a list of children of the specific subdirectory pointed to by route.
export function initialize({route: extRoute}) {
  if (atStr(extRoute, -1) === "/") extRoute = sliceStr(extRoute, 0, -1);
  // Parse and the (extended) route.
  let [route, ...castingSegments] = split(extRoute, ";");
  let isLocked, upNodeID, homeDirID, localPath, dirSegments, fileName,
    fileExt, queryPathSegments;
  try {
    [
      isLocked, upNodeID, homeDirID, localPath, dirSegments, fileName, fileExt,
      queryPathSegments
    ] = parseRoute(route);
  }
  catch (_) {
    return {isInvalid: true};
  }

  // Calculate the home path of the route.
  let routeHomePath = homeDirID ? "/" + upNodeID + "/" + homeDirID : undefined;

  // If there is no filePath or casting segments, record that route is a
  // "directory path."
  let isDirectoryPath = (!localPath && castingSegments.length === 0);

  // If if it is a directory path, reinterpret the route by putting a ';' after
  // the homeDirID, which means that the route becomes a casted as a
  // subdirectory route.
  let transformedRoute = extRoute;
  if (isDirectoryPath) {
    let subdirectoryPath = join(queryPathSegments, "/");
    transformedRoute = routeHomePath + ";/" + subdirectoryPath;
  }

  // Also record if the route is a text file, and whether is has a query path,
  // e.g. a "./call" or "./get" query path.
  let isTextFile = fileExt && isTextFileExtension(fileExt);
  let isTextFileQuery = isTextFile && queryPathSegments.length > 0;

  // Then call getRouteJSXWithSubLinks() to get a <span> element with the route
  // where every single queryable segment is an individual ILink, meaning that
  // the user can navigate to ancestor directories, or to pre-casted versions
  // of a casted route.
  let routeJSXWithSubLinks = getRouteJSXWithSubLinks(
    castingSegments, routeHomePath, localPath, isDirectoryPath, isTextFileQuery,
    queryPathSegments
  );

  // Record wether a separate query for the text file should be made.
  let fetchFile = isTextFileQuery || isTextFile && castingSegments.length > 0;

  return {
    extRoute: extRoute, isLocked: isLocked, routeHomePath: routeHomePath,
    filePath: localPath,
    transformedRoute: transformedRoute, isDirectoryPath: isDirectoryPath,
    fetchFile: fetchFile, isTextFile: isTextFile,
    routeJSXWithSubLinks: routeJSXWithSubLinks,
  };
} 




function getRouteJSXWithSubLinks(
  castingSegments, routeHomePath, filePath, isDirectoryPath, isTextFileQuery,
  queryPathSegments = []
) {
  // If there is no filePath, interpret queryPathSegments as an array of
  // subdirectories, and else parse the subdirectories and file name from
  // filePath.
  let directorySegments, fileName;
  if (isDirectoryPath) {
    directorySegments = queryPathSegments;
  }
  else {
    let pathSegments = split(filePath, "/");
    directorySegments = sliceArr(pathSegments, 0, -1);
    fileName = atArr(pathSegments, -1);
  }

  // Initialize an accumulative path for the following ILinks.
  let href, acc = "~/f" + routeHomePath;

  // Create an ILink to the home directory.
  href = acc;
  let homeILink = <ILink key="h" href={href}>{routeHomePath}</ILink>;

  // Then create an array of ILinks to each additional subdirectory, if any.
  let subdirectoryLinks = map(directorySegments, (val, ind) => {
    acc += "/" + val;
    href = acc;
    return <ILink key={"s" + ind} href={href}>{val}</ILink>;
  });

  // Also create an ILinks to the file if the file is a text file and the
  // queryPathSegments array is nonempty.
  let fileLink = isTextFileQuery ?
    <ILink key={"f"} href={acc + "/" + fileName}>{fileName}</ILink> :
    undefined;
  
  // Then create an ILink to the result as it is before any casting.
  let resultSegment = fileName ? fileName + (
    queryPathSegments.length === 0 ? "" : join(queryPathSegments, "/")
  ) : undefined;
  acc += "/" + resultSegment;
  href = encodeURI(acc);
  let resultLink = <ILink key={"r"} href={href}>{resultSegment}</ILink>;

  // Then create an ILink for each casting segment.
  let castingLinks = map(castingSegments, (segment, ind) => {
    acc += ";" + segment;
    href = encodeURI(acc);
    return <ILink key={"cast" + ind} href={href}>{segment}</ILink>;
  });

  // Then gather all these links into an array that also includes "/"
  // delimiters, and return that.
  let slashDelimiter = <span className='slash'>{"/"}</span>;
  let semicolonDelimiter = <span className='semicolon'>{";"}</span>;
  return [
    homeILink, ...map(subdirectoryLinks, link => [slashDelimiter, link]),
    ...(fileLink ? [slashDelimiter, fileLink] : []),
    ...(resultLink ? [slashDelimiter, resultLink] : []),
    ...map(castingLinks, link => [semicolonDelimiter, link]),
  ];
}




export function render({route}) {
  if (atStr(route, -1) === "/") route = sliceStr(route, 0, -1);
  let {
    isInvalid, isMissing, extRoute, isLocked, routeHomePath, filePath,
    transformedRoute, isDirectoryPath, fetchFile, isTextFile,
    routeJSXWithSubLinks,
    adminID, fileText, result
  } = this.state;
  let content;

  // If the route changes (significantly), reset adminID, fileText, and result.
  if (route !== extRoute) {
    this.setState(initialize(this.props));
  }

  if (isLocked || isInvalid || !routeHomePath) {
    content = <div className="invalid-route">{"invalid route: "}{route}</div>;
  }
  else if (isMissing) {
    content = <div className="missing">{"missing"}</div>;
  }

  // Before any fetches has been made, fetch the admin ID, the result pointed
  // to by the route, and potentially the text file content as well if the
  // route is a path to a text file plus a query path.
  else if (adminID === undefined) {
    this.setState(state => ({...state, adminID: false}));
    fetch(routeHomePath + "./admin").then(adminID => {
      this.setState(state => ({...state, adminID: adminID ? adminID : "None"}));
    });
    fetch(transformedRoute).then(result => {
      this.setState(state => ({...state, result: result}));
    });
    if (fetchFile) {
      fetch(routeHomePath + "/" + filePath + ";string").then(text => {
        this.setState(state => ({...state, fileText: text}));
      });
    }
    content = <div className="fetching">{"..."}</div>;
  }

  else if (
    !adminID || result === undefined || fetchFile && fileText === undefined
  ) {
    content = <div className="fetching">{"..."}</div>;
  }

  else {
    // Break up the result into lines with line numbers in front, unless the
    // route is a directory route, in which case let each line be an ILink
    // to the given child of the directory.
    let transformedResult = isDirectoryPath ?
      map((result ?? []), (child, ind) => {
        let isFile = (indexOf(child, ".") !== -1);
        return <div className={isFile ? "file-link" : "directory-link"}>
          <ILink key={"child" + ind} href={
            "~/f" + encodeURI(route + "/" + child)
          }>
            {child}
          </ILink> 
        </div>;
      }) :
      (hasType(result, "JSXElement")) ?
        <TextDisplay key="_result" jsxElement={result} /> :
        isTextFile ?
          <code className="jsx numbered">{toString(result, true)}</code> :
          <div>{toString(result, true)}</div>;
        // map(split(toString(result, true), "\n"), (line, ind) => (
        //   <code className="line">{ind + 1}{": "}{line}<br/></code>
        // ));

    // // And in case of a text file query, break up the fileText into individual
    // // lines with line numbers in front.
    // let brokenUpText = fetchFile ? map(
    //   split(fileText, "\n"), (line, ind) => (
    //     <code className="line">{ind + 1}{": "}{line}<br/></code>
    //   )
    // ) : undefined;

    // Then construct the final content.
    content = [
      <hr/>,
      result?.Class ? [
        <div className="submit-entity">
          {
            "The result seems to be a semantic entity. Want to submit it " +
            "and go to its entity page?"
          }
          <div>
            <button onClick={() => {
              postEntity(route).then(entID => {
                this.trigger("pushURL", "~/e/" + entID);
              });
            }}>{"Submit and go to page"}</button>
          </div>
        </div>,
        <hr/>,
      ] : undefined,
      <div className="admin">{"Admin: "}{
        adminID ? <EntityReference key="admin"
          entKey={getUserEntPath("1", adminID)}
        /> : "None"
      }</div>,
      <hr/>,
      <div className="result">{
        isTextFile && !fetchFile ? <h3>{"File contents"}</h3> :
          isDirectoryPath ? <h3>{"Directory contents"}</h3> :
            <h3>{"Result"}</h3>
        }
        <div>{transformedResult}</div>
      </div>,
      <hr/>,
      fetchFile ? <div className="text-file-content">
        <h3>{"File contents"}</h3>
        {/* TODO: Use different CSS classes for different file types. */}
        {/* TODO: And at some later point, implement syntax highlighting. */}
        <code className="jsx numbered">
          {fetchFile ? fileText : undefined}
        </code>
      </div> : undefined,
    ];
  }

  return (
    <div className="file-browser">
      <div className="route">{routeJSXWithSubLinks}</div>
      {content}
    </div>
  );
}


