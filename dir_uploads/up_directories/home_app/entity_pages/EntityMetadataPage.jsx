
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";
import {mapToArray} from 'object';

import * as ILink from 'ILink.jsx';
import * as TextWithSubstitutedLinks from "./TextWithSubstitutedLinks.jsx";


export function render({entKey}) {
  let {entPath, entDef, curEntKey} = this.state;
  let content;

  // If entKey changes reset the state.
  if (entKey !== curEntKey) {
    this.setState(getInitState({entKey: entKey}));
  }

  // If the entity path has not already been fetched, do so.
  if (entPath === undefined) {
    fetchEntityPath(entKey).then(entPath => {
      this.setState(state => ({...state, entPath: entPath ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  else if (!entPath) {
    content = <div className="fetching">{"missing"}</div>;
  }

  // Else if the entity definition has not already been fetched, do so.
  if (entDef === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  else if (!entDef) {
    content = <div className="fetching">{"missing"}</div>;
  }

  else {
    content = [
      <div className="ent-path">
        {"Entity path: "}
        <ILink key="em" href={"/f" + entPath}>{entPath}</ILink>
      </div>,
      <table className="attribute-table">{
        mapToArray(entDef, (val, key, ind) => (
          <tr>
            <th>{key}</th>
            <td>{
              typeof val === "string" ?
                <TextWithSubstitutedLinks key={"attr-" + ind}
                  children={val}
                /> :
                (val === undefined) ? "undefined" : val
            }</td>
          </tr>
        ))
      }</table>
    ];
  }
  
  return (
    <div className="metadata-page">
      {content}
    </div>
  );
}



export function getInitState({entKey}) {
  return {curEntKey: entKey};
}