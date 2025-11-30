
import {map} from 'array';
import {hasType} from 'type';
import * as EntityList from "../entity_lists/EntityList.jsx";

const relevantQualitiesRel = "/1/1/em1.js;get/relevantQualities";

const QualityElementPromise = import("../entity_elements/QualityElement.jsx");


export function render({objKey, extQualKeyArr = undefined}) {
  extQualKeyArr ??= this.subscribeToContext("extQualKeyArr") ?? [];
  let {QualityElement, isFetching} = this.state;

  if (!isFetching) {
    this.setState(state => ({...state, isFetching: true}));
    QualityElementPromise.then(Component => {
      this.setState(state => ({...state, QualityElement: Component}));
    });
  }
  if (!QualityElement) {
    return <div><div className="fetching">{"..."}</div></div>;
  }

  let contextQualityElements = (extQualKeyArr[0] === undefined) ? undefined :
    map(extQualKeyArr, extKey => {
      if (hasType(extKey, "array")) {
        let subjKey = objKey;
        let [objKey, relKey] = extKey; 
        return <QualityElement key={"cq-" + extKey}
          subjKey={subjKey} relKey={relKey} objKey={objKey}
        />;
      }
      else {
        let qualKey = extKey;
        return <QualityElement key={"cq-" + qualKey}
          qualKey={qualKey} subjKey={objKey}
        />;
      }
    });
  return <div>
    <EntityList key="rql"
      objKey={objKey} relKey={relevantQualitiesRel}
      ElementComponent={QualityElement} constElementArr={contextQualityElements}
    />
  </div>;
}
