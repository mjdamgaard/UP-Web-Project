
import {fetchEntityProperty} from "/1/1/entities.js";
import * as QualitiesPage from "./QualitiesPage.jsx";

const probabilityQual = "/1/1/em1.js;get/probability";
const isCorrectQual = "/1/1/em1.js;get/isCorrect";


export function render({objKey, extQualKeyArr = undefined}) {
  extQualKeyArr ??= this.subscribeToContext("extQualKeyArr") ?? [];
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
    return <div className="fetching">{"..."}</div>;
  }

  extQualKeyArr = [
    (isSingular ? probabilityQual : isCorrectQual),
    ...(extQualKeyArr ?? [])
  ];

  return <QualitiesPage key="0" objKey={objKey}
    extQualKeyArr={extQualKeyArr}
  />;
}
