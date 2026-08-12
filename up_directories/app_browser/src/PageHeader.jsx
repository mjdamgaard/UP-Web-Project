
import {fetchEntityID} from "../../semantic_entities/entities.js";
import * as ILink from 'ILink';
import * as ExtRatingDisplay from "./ratings/ExtRatingDisplay.jsx";

import placeholders from "~/placeholders.js";

const {this: {
  nodeID: nodeID,
  directories: {
    "file_browser": fileBrowserDirID,
  }
}} = placeholders;

const [membersRelIDProm, subclassesRelIDProm, versionsRelIDProm] = [
  fetchEntityID(abs("~/../semantic_entities/em1.js;get/members")),
  fetchEntityID(abs("~/../semantic_entities/em1.js;get/subclasses")),
  fetchEntityID(abs("~/../semantic_entities/em3.js;get/versionsRel")),
];


export function initialize({type}) {

}

export function render({entDef, type, entID, ancCatIDs, ancAppIDs}) {
  let name = entDef["Name"];
  let appDirID = entDef["App directory ID"];
  let parentApp = ancAppIDs.at(-1);
  let parent = parentApp ?? ancCatIDs.at(-1);
  return <div className="page-header">
    <div className={"go-up-button" + (parent ? "" : " inactive")}
      onClick={() => parent && this.do("goUpOnePage", [parentApp, parent])}>
    </div>
    <div className="title-and-links">
      <h2>
        {entDef["Name"]} 
      </h2>
      <div className="type-field">
        Type: {type === "cat" ? "Category" : "App"}
      </div>
      <ul className="links">{(type !== "app" ? undefined : <>
        <li className="files-link">
          <ILink key="files"
            href={`/${fileBrowserDirID}/files/${nodeID}/${appDirID}`}
          >
            View source code files
          </ILink>
        </li>
        <li className="app-link">
          <ILink key="app" href={`/${appDirID}`}>
            View app
          </ILink>
        </li>
        <li className="original-version-link">
          <ILink key="orig" href={`/o-${appDirID}`}>
            View original version
          </ILink>
        </li>
        {/* TODO: At some point add link(s) to go to the app page of the
        current top/preferred version of this app. */}
      </>)}</ul>
    </div>
    {/* <div className="ratings">{(!parent ? undefined :
      <ExtRatingDisplay key="r"
        entID={entID} entDef={entDef} type={type} objID={parent}
        relID={type === "cat" ? relID : "..."}
        ancAppIDs={ancAppIDs}
      />
    )}</div> */}
    <hr/>
  </div>
}



export const actions = {
  "goUpOnePage": function([parentApp, parent]) {
    if (parentApp) {
      this.pushURL("../");
    }
    else if (parent) {
      let {ancCatIDs} = this.props;
      this.pushURL("~/apps/cat/" + ancCatIDs.join("/"));
    }
  },
};