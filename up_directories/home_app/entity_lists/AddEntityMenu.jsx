
import {map} from 'array';
import {postEntity} from "/1/1/entities.js";

import * as InputText from 'InputText.jsx';

const QualityElementPromise = import(
  "../entity_elements/QualityElement.jsx"
);



export function render({qualKeyArr}) {
  let {QualityElement, isFetching, response, entityElements} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    QualityElementPromise.then(Component => {
      this.setState(state => ({...state, QualityElement: Component}));
    });
  }
  if (!QualityElement) {
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
            entityElements: undefined,
          }));
          return;
        }
        postEntity(entKey).then(entID => {
          if (!entID) {
            this.setState(state => ({
              ...state, response: <span className="warning">
                {"Invalid entity path"}
              </span>,
              entityElements: undefined,
            }));
          }
          else {
            this.setState(state => ({
              ...state,
              response: "Entity has been assigned the ID of " +
                entID + ". Now give it some relevant scores.",
              entityElements: map(qualKeyArr, qualKey => (
                <QualityElement key={"_" + qualKey}
                  subjKey={entID} qualKey={qualKey} startOpen
                />
              )),
            }));
          }
        });
      });
    }}>{"Submit"}</button>
    <div className="response-display">{response}</div>
    <div className="qualities">{entityElements}</div>
  </div>;
}