
import {
  fetchEntityDefinition, fetchEntityPath, fetchEntityID,
} from "/1/1/entities.js";
import {mapToArray} from 'object';
import {stringify} from 'json';

import * as ILink from 'ILink.jsx';
import * as TextWithSubstitutedLinks from "./TextWithSubstitutedLinks.jsx";
import * as TextDisplay from "../utility_components/TextDisplay.jsx";


export function render({entKey}) {
  let {entPath, entDef, entID, isFetching, curEntKey} = this.state;
  let content;

  // If entKey changes reset the state.
  if (entKey !== curEntKey) {
    this.setState(getInitialState(this.props));
  }

  // If date hasn't begun fetching yet, start fetching.
  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));

    fetchEntityPath(entKey).then(entPath => {
      this.setState(state => ({...state, entPath: entPath ?? false}));
    });
    fetchEntityDefinition(entKey).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    fetchEntityID(entKey).then(entID => {
      this.setState(state => ({...state, entID: entID ?? false}));
    });

    content = <div className="fetching">{"..."}</div>;
  }

  else if (entDef === undefined) {
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
      <h3>{"Entity ID"}</h3>,
      <div className="ent-id">{
        entID === undefined ? <span className="fetching">{"..."}</span> :
          entID ? "#" + entID :
            <span className="missing">{"missing"}</span>
      }</div>,
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