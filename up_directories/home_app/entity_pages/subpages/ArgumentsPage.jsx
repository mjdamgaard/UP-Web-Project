
import {fetchEntityDefinition, fetchScalarEntityPath} from "/1/1/entities.js";
import * as EntityList from "../../entity_lists/EntityList.jsx";
import * as ScoreInterface from "../../scoring/ScoreInterface.jsx";

const argumentsRel = "/1/1/em1.js;get/argumentsRelation";
const probabilityQual = "/1/1/em1.js;get/probability";
const isCorrectQual = "/1/1/em1.js;get/isCorrect";

const ArgumentElementPromise =
  import("../../entity_elements/ArgumentElement.jsx");


export function render({
  objTextKey = undefined, objScalarKey = undefined
}) {
  let {ArgumentElement, objTruthScalarKey, isFetching} = this.state;
  objScalarKey ??= objTruthScalarKey;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    ArgumentElementPromise.then(Component => {
      this.setState(state => ({...state, ArgumentElement: Component}));
    });
    if (!objScalarKey) {
      fetchEntityDefinition(objTextKey, ["Is a singular statement"]).then(
        entDef => {
          let truthQual = entDef["Is a singular statement"] ?
            probabilityQual : isCorrectQual;
          this.setState(state => ({...state, entDef: entDef ?? false}));
          fetchScalarEntityPath(objTextKey, truthQual).then(
            objTruthScalarKey => {
              this.setState(state => ({
                ...state,
                objTruthScalarKey: objTruthScalarKey ?? false,
              }));
            }
          );
        }
      );
    }
  }

  if (!ArgumentElement || !objScalarKey) {
    return <div><div className="fetching">{"..."}</div></div>;
  }

  return <div>
    <h3>{"Scalar"}</h3>
    <ScoreInterface key="_scalar" scalarKey={objScalarKey} />
    <h3>{"Arguments"}</h3>
    <EntityList key="args"
      objKey={objScalarKey} relKey={argumentsRel}
      ElementComponent={ArgumentElement} extraElementProps={{
        objScalarKey: objScalarKey,
      }}
    />
  </div>;
}
