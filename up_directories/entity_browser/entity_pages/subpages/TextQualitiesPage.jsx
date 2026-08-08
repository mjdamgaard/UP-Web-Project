
import {fetchEntityProperty} from "~/../semantic_entities/entities.js";
import * as QualitiesPage from "./QualitiesPage.jsx";

const probabilityQual = abs("~/../semantic_entities/em1.js;get/probability");
const isCorrectQual = abs("~/../semantic_entities/em1.js;get/isCorrect");


export function render({objKey, extQualKeyArr = undefined}) {
  extQualKeyArr ??= this.getContext("extQualKeyArr") ?? [];
  let {isSingular, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    fetchEntityProperty(
      objKey, ["Is a singular statement"]
    ).then(isSingular => {
      this.setState(state => ({...state, isSingular: !!isSingular}));
    });
  }

  if (isSingular === undefined) {
    return <div className="loading"></div>;
  }

  extQualKeyArr = [
    (isSingular ? probabilityQual : isCorrectQual),
    ...(extQualKeyArr ?? [])
  ];

  return <QualitiesPage key="0" objKey={objKey}
    extQualKeyArr={extQualKeyArr}
  />;
}
