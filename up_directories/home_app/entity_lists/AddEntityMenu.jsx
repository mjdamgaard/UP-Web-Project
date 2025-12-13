
import {post} from 'query';
import {map} from 'array';
import {
  postEntity, checkDomain, postScalarEntity, postRelationalQuality,
} from "/1/1/entities.js";

import * as InputText from 'InputText.jsx';
import * as TextArea from 'TextArea.jsx';
import * as InputCheckbox from 'InputCheckbox.jsx';
import * as Label from 'Label.jsx';

const textClassPath = "/1/1/em1.js;get/texts";
const scalarClassPath = "/1/1/em1.js;get/scalars";
const probabilityQual = "/1/1/em1.js;get/probability";
const isCorrectQual = "/1/1/em1.js;get/isCorrect";

const QualityElementPromise = import(
  "../entity_elements/QualityElement.jsx"
);



export function render({qualKeyArr, objKey = undefined}) {
  let {
    QualityElement, isFetching, response, qualityElements,
    isTextOrScalarClass, cbSingIDKey, cbEntIDKey, hasGrabbedFocus,
  } = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    QualityElementPromise.then(Component => {
      this.setState(state => ({...state, QualityElement: Component}));
    });
    checkDomain(qualKeyArr[0], textClassPath).then(isTextClass => {
      this.setState(state => ({
        ...state,
        isTextOrScalarClass: state.isTextOrScalarClass || isTextClass,
      }));
    });
    checkDomain(qualKeyArr[0], scalarClassPath).then(isScalarClass => {
      this.setState(state => ({
        ...state,
        isTextOrScalarClass: state.isTextOrScalarClass || isScalarClass,
        isScalarClass: isScalarClass,
      }));
    });
  }
  if (!QualityElement || isTextOrScalarClass === undefined) {
    return <div className="add-entity-menu">
      <div className="fetching">{"..."}</div>
    </div>;
  }

  // If the instance has not grabbed focus before for its input, do so now.
  if (!hasGrabbedFocus) {
    this.doAfterRender("focus-input");
  }

  return <div className="add-entity-menu">
    <div>{
      "Submit the ID or the path of the entity to insert, then score it " +
      "with respect to the relevant qualities."
    }</div>
    <div>
      <Label key="l-ent" forKey={cbEntIDKey}>{"Entity ID or path: "}</Label>
      <InputText key="i" idKey={cbEntIDKey} size={60} />
    </div>
    <button onClick={() => this.do("submitEntityToInsert")}>
      {"Submit"}
    </button>
    {!isTextOrScalarClass ? undefined : <>
      <div>{
        "Or write and insert a new text entity."
      }</div>
      <div>
        <TextArea key="ta" />
      </div>
      <div>
        <Label key="l-sing" forKey={cbSingIDKey}>
          {"Is a singular statement (that can be assigned a probability): "}
        </Label>
        <InputCheckbox key="cb-sing" idKey={cbSingIDKey} />
      </div>
      <button onClick={() => this.do("submitTextEntityToInsert")}>
        {"Post"}
      </button>
    </>}
    <div className="response-display">{response}</div>
    <div className="qualities">{qualityElements}</div>
  </div>;
}


export function initialize() {
  let cbSingIDKey = Symbol("cbSingIDKey");
  let cbEntIDKey = Symbol("cbEntIDKey");
  return {cbSingIDKey: cbSingIDKey, cbEntIDKey: cbEntIDKey};
}



export const actions = {
  "focus-input": function() {
    let {isTextOrScalarClass} = this.state;
    let inputKey = isTextOrScalarClass ? "ta" : "i";
    this.call(inputKey, "focus");
    this.setState(state => ({...state, hasGrabbedFocus: true}));
  },
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
          qualityElements: undefined,
        }));
        return;
      }
      postEntity(entKey).then(entID => {
        if (!entID) {
          this.setState(state => ({
            ...state, response: <span className="warning">
              {"Invalid entity path"}
            </span>,
            qualityElements: undefined,
          }));
        }
        else {
          this.setState(state => ({
            ...state,
            response: "Entity has been assigned the ID of " +
              entID + ". Now give it some relevant scores.",
            qualityElements: map(qualKeyArr, qualKey => (
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
    let {QualityElement, isScalarClass} = this.state;
    let text = this.call("ta", "getValue");
    let isSingular = this.call("cb-sing", "getIsChecked");
    if (!text) return;
    this.trigger("postUserEntity").then((userEntID) => {
      if (!userEntID) {
        this.setState(state => ({
          ...state, response: <span className="warning">
            {"User is not logged in"}
          </span>,
          qualityElements: undefined,
        }));
        return;
      }
      post(
        "/1/1/comments/comments.sm.js./callSMF/postComment",
        [text, objKey, isSingular, true],
      ).then(textEntID => {
        // Post the relevant scalar, then update the state.
        postScalarEntity(
          textEntID, isSingular ? probabilityQual : isCorrectQual
        ).then(scalarEntID => {
          if (isScalarClass) {
            this.setState(state => ({
              ...state,
              response: "Scalar entity has been assigned the ID of " +
                scalarEntID + ". Now give it some relevant scores.",
              qualityElements: map(qualKeyArr, qualKey => (
                <QualityElement key={"_" + qualKey}
                  subjKey={scalarEntID} qualKey={qualKey} startOpen
                />
              )),
            }));
          }
          else {
            this.setState(state => ({
              ...state,
              response: "Text entity has been assigned the ID of " +
                textEntID + ". Now give it some relevant scores.",
              qualityElements: map(qualKeyArr, qualKey => (
                <QualityElement key={"_" + qualKey}
                  subjKey={textEntID} qualKey={qualKey} startOpen
                />
              )),
            }));
          }
        });
      });
    });
  },
};



export const styleSheetPaths = [
  abs("./EntityList.css"),
];