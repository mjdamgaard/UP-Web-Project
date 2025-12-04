
import {toString} from 'string';
import {fetchEntityDefinition} from "/1/1/entities.js";
import * as TextDisplay from "../misc/TextDisplay.jsx";


// TODO: Cut off long texts, using some expandable component.


export function render({entID, extQualKeyArr}) {
  let {entDef, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(entID, [
      "Name", "Author", "Target entity", "Content", "Is a singular statement",
    ]).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    return <div className="content-page fetching">{"..."}</div>;
  }

  else if (entDef === undefined) {
    return <div className="content-page fetching">{"..."}</div>;
  }

  else if (!entDef) {
    return <div className="content-page missing">{"missing"}</div>;
  }

  let text = toString(entDef["Content"]);
  return <div className="content-page">
    <div className="text">{
      (typeof text === "string") ?
        text :
        <TextDisplay jsxElement={text} />
    }</div>
  </div>;
}


