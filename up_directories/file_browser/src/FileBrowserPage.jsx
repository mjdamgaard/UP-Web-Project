
import {split, toString, indexOf} from 'string';
import {map} from 'array';
import {hasType} from 'type';
import {fetch, encodeURI} from 'query';
import {getUserEntPath, postEntity} from "/1/1/entities.js";

import * as ILink from 'ILink';
import * as EntityReference from "../../utilities/EntityReference.jsx";
import * as TextDisplay from "../../utilities/TextDisplay.jsx";



export const keyProps = ["extRoute"];

export async function initialize({
  extRoute, routeHomePath, localPath, transformedRoute, fetchFile,
}) {
  let [adminID, result, fileText] = await Promise.all([
    fetch(routeHomePath + "./admin"),
    fetch(transformedRoute),
    fetchFile ? fetch(routeHomePath + "/" + localPath + ";string") :
      new Promise(resolve => resolve(undefined)),
  ]);
  this.setState({
    adminID: adminID ?? false, result: result, fileText: fileText,
  });
}

export function render({
  extRoute, isDirectoryPath, fetchFile, isTextFile, routeJSXWithSubLinks,
  route,
}) {
  let {adminID, fileText, result} = this.state;
  let content;
  if (adminID === undefined) {
    content = <div className="loading"></div>;
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
        <TextDisplay key="_result" untrusted jsxElement={result} /> :
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
      <div className="admin">{"Admin: "}{(
        adminID ? <EntityReference key="admin"
          entKey={getUserEntPath("1", adminID)} hasLinks={false}
        /> : "None"
      )}</div>,
      <hr/>,
      <div className="result">{(
        isTextFile && !fetchFile ? <h3>{"File contents"}</h3> :
          isDirectoryPath ? <h3>{"Directory contents"}</h3> :
            <h3>{"Result"}</h3>
        )}
        <div>{(transformedResult)}</div>
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
      <div className="route">{(routeJSXWithSubLinks)}</div>
      {(content)}
    </div>
  );
}
