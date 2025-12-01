
import {map} from 'array';
import {postEntity, checkDomain} from "/1/1/entities.js";

import * as InputText from 'InputText.jsx';
import * as Textarea from 'Textarea.jsx';
import * as InputCheckbox from 'InputCheckbox.jsx';

const textClassPath = "/1/1/em1.js;get/texts";

const QualityElementPromise = import(
  "../entity_elements/QualityElement.jsx"
);



export function render({qualKeyArr, objKey = undefined}) {
  let {
    QualityElement, isFetching, response, entityElements, isTextClass,
  } = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    QualityElementPromise.then(Component => {
      this.setState(state => ({...state, QualityElement: Component}));
    });
    checkDomain(qualKeyArr[0], textClassPath).then(isTextClass => {
      this.setState(state => ({...state, isTextClass: isTextClass}));
    });
  }
  if (!QualityElement || isTextClass === undefined) {
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
    <button onClick={() => this.do("submitEntityToInsert")}>
      {"Submit"}
    </button>
    {!isTextClass ? undefined : <>
      <div>{
        "Or write and insert a new text entity."
      }</div>
      <div>
        <Textarea key="ta" />
      </div>
      <div>
        <span>{"Is a singular statement: "}</span>
        <InputCheckbox key="icb" />
      </div>
      <button onClick={() => this.do("submitTextEntityToInsert")}>
        {"Submit"}
      </button>
    </>}
    <div className="response-display">{response}</div>
    <div className="qualities">{entityElements}</div>
  </div>;
}




export const actions = {
  "submitEntityToInsert": function() {
    let {qualKeyArr} = this.props;
    let {QualityElement} = this.state;
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
  },
  "submitTextEntityToInsert": function() {
    let {qualKeyArr, objKey = undefined} = this.props;
    let {QualityElement} = this.state;
    let text = this.call("ta", "getValue");
    let isSingular = this.call("icb", "getIsChecked");
    if (!text) return;
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
      post(
        "/1/1/comments/comments.sm.js./callSMF/postComment",
        [text, objKey, isSingular, true],
      ).then(entID => {
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
      });
    });
  },
};