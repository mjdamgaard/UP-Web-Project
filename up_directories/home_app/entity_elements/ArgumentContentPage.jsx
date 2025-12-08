
import {toString} from 'string';
import {fetchEntityDefinition, fetchEntityPath} from "/1/1/entities.js";
import * as TextDisplay from "../misc/TextDisplay.jsx";
import * as ScoreInterface from "../scoring/ScoreInterface.jsx";
import {fetchSubjectAndQualityIDs} from "../scoring/ScoreInterface.jsx";

const probabilityQual = "/1/1/em1.js;get/probability";
const isCorrectQual = "/1/1/em1.js;get/isCorrect";
const impactRel = "/1/1/em1.js;get/impact";

// TODO: Cut off long texts, using some expandable component.


export function render({subjScalarKey, objScalarKey}) {
  let {textEntDef, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchTextEntDefIfTruthScalar(subjScalarKey).then(textEntDef => {
      this.setState(state => ({...state, textEntDef: textEntDef ?? false}));
    });
    return <div className="content-page fetching">{"..."}</div>;
  }

  else if (textEntDef === undefined) {
    return <div className="content-page fetching">{"..."}</div>;
  }

  let scoreInterfaces = [
    <ScoreInterface key={"own-score"} scalarKey={subjScalarKey} />,
    <ScoreInterface key={"impact-score"}
      subjKey={subjScalarKey} extQualKey={[objScalarKey, impactRel]}
    />,
  ];

  let content = textEntDef ? toString(textEntDef["Content"]) : undefined;
  return <div className="content-page">
    <div className="text">{
      !content ? undefined : 
        (typeof content === "string") ?
          content :
          <TextDisplay jsxElement={content} />
    }</div>
    <div className="quality-elements">
      {scoreInterfaces}
    </div>
  </div>;
}





export function fetchTextEntDefIfTruthScalar(scalarKey) {
  return new Promise(resolve => {
    fetchSubjectAndQualityIDs(scalarKey).then(([subjID, qualID]) => {
      Promise.all([
        fetchEntityDefinition(subjID, true),
        fetchEntityPath(qualID),
      ]).then(([textEntDef, qualPath]) => {
        if (qualPath === probabilityQual || qualPath === isCorrectQual) {
          resolve(textEntDef);
        } else {
          resolve(false);
        }
      });
    });
  });
}