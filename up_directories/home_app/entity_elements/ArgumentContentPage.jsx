
import {toString} from 'string';
import {fetchEntityDefinition, fetchScalarEntityPath} from "/1/1/entities.js";
import * as TextDisplay from "../misc/TextDisplay.jsx";
import * as QualityElement from "../entity_elements/QualityElement.jsx";

const probabilityQual = "/1/1/em1.js;get/probability";
const isCorrectQual = "/1/1/em1.js;get/isCorrect";
const impactRel = "/1/1/em1.js;get/impact";

// TODO: Cut off long texts, using some expandable component.


export function render({entKey, objScalarKey}) {
  let {entDef, truthQual, subjScalarKey, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityDefinition(entKey, [
      "Name", "Author", "Target entity", "Content", "Is a singular statement",
    ]).then(entDef => {
      let truthQual = entDef["Is a singular statement"] ?
        probabilityQual : isCorrectQual;
      this.setState(state => ({...state, entDef: entDef ?? false}));
      fetchScalarEntityPath(subjKey, truthQual).then(subjScalarKey => {
        this.setState(state => ({
          ...state,
          entDef: entDef ?? false,
          truthQual: truthQual ?? false,
          subjScalarKey: subjScalarKey ?? false,
        }));
      });
    });
    return <div className="content-page fetching">{"..."}</div>;
  }

  else if (entDef === undefined) {
    return <div className="content-page fetching">{"..."}</div>;
  }

  else if (!entDef || !subjScalarKey) {
    return <div className="content-page missing">{"missing"}</div>;
  }

  let qualityElements = [
    <QualityElement key={"q-" + qualKey}
      qualKey={truthQual} subjKey={entKey}
    />,
    <QualityElement key={"q-" + qualKey}
      objKey={objScalarKey} relKey={impactRel} subjKey={subjScalarKey}
    />,
  ];

  let text = toString(entDef["Content"]);
  return <div className="content-page">
    <div className="text">{
      (typeof text === "string") ?
        text :
        <TextDisplay jsxElement={text} />
    }</div>
    <div className="quality-elements">
      {qualityElements}
    </div>
  </div>;
}


