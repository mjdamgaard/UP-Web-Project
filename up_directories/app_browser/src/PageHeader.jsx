
import * as ILink from 'ILink';

import placeholders from "~/placeholders.js";

const {
  this: {
    nodeID: nodeID,
    directories: {
      "file_browser": fileBrowserDirID,
    }
  },
} = placeholders;


export function render({entDef, type, entID, ancCatIDs, ancAppIDs}) {
  let name = entDef["Name"];
  let appDirID = entDef["App directory ID"];
  return <div className="page-header">
    <h2>
      {entDef["Name"]} 
    </h2>
    <div className="type-field">
      Type: {type === "cat" ? "Category" : "App"}
    </div>
      {(type !== "app" ? undefined : 
        <div className="files-link">
          <ILink href={
            `/${fileBrowserDirID}/files/${nodeID}/${appDirID}`
          }>
            View source code files
          </ILink>
        </div>
      )}
    <hr/>
  </div>
}