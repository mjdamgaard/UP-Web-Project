
import {toString} from 'string';
import {fetchEntityDefinition} from "/1/1/entities.js";
import * as TextDisplay from "../misc/TextDisplay.jsx";


// TODO: Cut off long texts if the cutOff prop is true.


export function render({entKey, cutOff = false}) {
  let {entDef, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(entKey, [
      "Author", "Target entity", "Content"
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

  let content = toString(entDef["Content"]);
  return <div className="content-page">
    <div className="text">
      <TextDisplay key="_0" jsxElement={content} />
    </div>
  </div>;
}


