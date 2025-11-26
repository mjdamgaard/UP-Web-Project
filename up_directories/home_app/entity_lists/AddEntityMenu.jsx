
import {postEntity} from "/1/1/entities.js";

import * as InputText from 'InputText.jsx';

const GeneralEntityElementPromise = import(
  "../entity_elements/GeneralEntityElement.jsx"
);



export function render({qualKeyArr}) {
  let {GeneralEntityElement, isFetching, response, entityElement} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    GeneralEntityElementPromise.then(Component => {
      this.setState(state => ({...state, GeneralEntityElement: Component}));
    });
  }
  if (!GeneralEntityElement) {
    return <div className="add-entity-menu">
      <div className="fetching">{"..."}</div>
    </div>;
  }

  return <div className="add-entity-menu">
    <div>{
      "Submit the ID or the path of the entity to insert, then score it " +
      "with respect to the relevant qualities."
    }</div>
    <div>
      <span>{"Entity ID or path: "}</span>
      <InputText key="i" size={60} />
    </div>
    <button onClick={() => {
      let entKey = this.call("i", "getValue");
      this.trigger("postUserEntity").then((userEntID) => {
        if (!userEntID) {
          this.setState(state => ({
            ...state, response: <span className="warning">
              {"User is not logged in"}
            </span>,
            entityElement: undefined,
          }));
          return;
        }
        postEntity(entKey).then(entID => {
          if (!entID) {
            this.setState(state => ({
              ...state, response: <span className="warning">
                {"Invalid entity path"}
              </span>,
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
      });
    }}>{"Submit"}</button>
    <div className="response-display">{response}</div>
    <div className="entity-display">{entityElement}</div>
  </div>;
}