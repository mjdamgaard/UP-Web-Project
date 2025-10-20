
import {postEntity} from "/1/1/entities.js";

import * as InputText from 'InputText.jsx';
import * as GeneralEntityElement
from "../entity_elements/GeneralEntityElement.jsx";



export function render({qualKeyArr}) {
  let {response, entityElement} = this.state;

  return <div className="add-entity-menu">
    <div>{
      "Add entity to the current list by first submitting its (absolute) " +
      "path in the following field, or its entity ID (with or without a " +
      "leading '#') and then score it according the the relevant qualities."
    }</div>
    <div>
      <span>{"Entity path or ID: "}</span>
      <InputText key="i" size={60} />
    </div>
    <button onClick={() => {
      let entKey = this.call("i", "getValue");
      postEntity(entKey).then(entID => {
        if (!entID) {
          this.setState(state => ({
            ...state, response: "Invalid entity path",
            entityElement: undefined,
          }));
        }
        else {
          this.setState(state => ({
            ...state, response: "Entity has been assigned the ID of " +
            entID + ". Now give it some relevant scores.",
            entityElement: <GeneralEntityElement key={"_" + entID}
              entID={entID} qualKeyArr={qualKeyArr} startExpanded={true}
            />,
          }));
        }
      });
    }}>{"Submit"}</button>
    <div className="response-display">{response}</div>
    <div className="entity-display">{entityElement}</div>
  </div>;
}