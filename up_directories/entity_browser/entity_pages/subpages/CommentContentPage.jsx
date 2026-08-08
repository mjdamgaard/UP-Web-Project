
import {fetchEntityDefinition} from "~/../semantic_entities/entities.js";
import * as TextDisplay from "../../../utilities/TextDisplay.jsx";


// TODO: If the user is the author of the comment, make it possible to edit or
// delete it.

// TODO: Cut off long texts, using some expandable component.


export function render({entID, entKey = entID}) {
  let {entDef, isFetching} = this.state;
  // let userEntID = this.getContext("userEntID");
  // let userID = this.getContext("userID");
  // let userEntPath = abs("~/../semantic_entities/em1.js;call/User/1/") + userID;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(entKey, [
      "Name", "Author", "Target entity", "Content", "Is a singular statement",
    ]).then(entDef => {
      this.setState(state => ({...state, entDef: entDef ?? false}));
    });
    return <div className="content-page fetching"></div>;
  }

  else if (entDef === undefined) {
    return <div className="content-page fetching"></div>;
  }

  else if (!entDef) {
    return <div className="content-page missing">{"missing"}</div>;
  }

  let content = entDef["Content"].toString();
  return <div className="content-page">
    <div className="text">
      <TextDisplay key="_0" untrusted jsxElement={content} />
    </div>
  </div>;
}


