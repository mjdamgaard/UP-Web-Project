
import {fetchEntityDefinition, fetchScalarEntityPath} from
  "~/../semantic_entities/entities.js";
import * as EntityList from "../../entity_lists/EntityList.jsx";
import * as ScoreInterface from "../../scoring/ScoreInterface.jsx";

const argumentsRel = abs("~/../semantic_entities/em1.js;get/argumentsRelation");
const impactRel = abs("~/../semantic_entities/em1.js;get/impact");
const probabilityQual = abs("~/../semantic_entities/em1.js;get/probability");
const isCorrectQual = abs("~/../semantic_entities/em1.js;get/isCorrect");

const ArgumentElementPromise =
  import("../../entity_elements/ArgumentElement.jsx");


export function render({
  objTextKey = undefined, objScalarKey = undefined
}) {
  let {objTruthScalarKey, isFetching} = this.state;
  objScalarKey ??= objTruthScalarKey;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
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

  if (!objScalarKey) {
    return <div><div className="loading"></div></div>;
  }

  return <div>
    <h3>{"Scalar"}</h3>
    <ScoreInterface key="_scalar" scalarKey={objScalarKey} />
    <h3>{"Arguments"}</h3>
    <EntityList key="args"
      objKey={objScalarKey} relKey={argumentsRel} otherExtQualKeyArr={[
        [objScalarKey, impactRel],
      ]}
      ElementComponent={ArgumentElementPromise} extraElementProps={{
        objScalarKey: objScalarKey,
      }}
    />
  </div>;
}
