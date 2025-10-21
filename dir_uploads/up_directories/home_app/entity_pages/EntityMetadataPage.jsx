
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";
import {mapToArray} from 'object';
import {stringify} from 'json';

import * as ILink from 'ILink.jsx';
import * as TextWithSubstitutedLinks from "./TextWithSubstitutedLinks.jsx";
import * as TextDisplay from "../utility_components/TextDisplay.jsx";


export function render({entKey}) {
  let {entPath, entDef, curEntKey} = this.state;
  let content;

  // If entKey changes reset the state.
  if (entKey !== curEntKey) {
    this.setState(getInitialState(this.props));
  }

  // If the entity path has not already been fetched, do so.
  if (entPath === undefined) {
    fetchEntityPath(entKey).then(entPath => {
      this.setState(state => ({...state, entPath: entPath ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  else if (!entPath) {
    content = <div className="missing">{"missing"}</div>;
  }

  // Else if the entity definition has not already been fetched, do so.
  if (entDef === undefined) {
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    content = <div className="fetching">{"..."}</div>;
  }

  else if (!entDef) {
    content = <div className="missing">{"missing"}</div>;
  }

  else {
    let descAttr = entDef.Documentation ?? entDef.Description;
    content = [
      <h3>{"Entity path"}</h3>,
      <div className="ent-path">
        <ILink key="em" href={"~/f" + entPath}>{entPath}</ILink>
      </div>,
      <hr/>,
      <h3>{"Attributes"}</h3>,
      <table className="attribute-table">{
        mapToArray(entDef, (val, key, ind) => (
          <tr>
            <th>{key}</th>
            <td>{
              (typeof val === "string") ?
                <TextWithSubstitutedLinks key={"attr-" + ind}
                  children={val}
                /> :
              (val && typeof val === "object") ? stringify(val) :
              (val === undefined) ? "undefined" : val
            }</td>
          </tr>
        ))
      }</table>,
      <hr/>,
      <h3>{entDef.Documentation ? "Documentation" : "Description"}</h3>,
      descAttr ? (
        descAttr[0] === "/" ?
          <TextDisplay key="_desc" jsxLink={descAttr} /> :
          <TextDisplay key="_desc" jsxElement={descAttr} />
      ) : <TextDisplay key="_desc" jsxElement={"No description"} />,
    ];
  }
  
  return (
    <div className="metadata-page">
      {content}
    </div>
  );
}



export function getInitialState({entKey}) {
  return {curEntKey: entKey};
}