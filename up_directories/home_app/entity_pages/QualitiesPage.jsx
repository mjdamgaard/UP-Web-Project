
import {map} from 'array';
import {hasType} from 'type';
import * as EntityList from "../entity_lists/EntityList.jsx";

const relevantQualitiesRel = "/1/1/em1.js;get/relevantQualities";

const QualityElementPromise = import("../entity_elements/QualityElement.jsx");


export function render({objKey, qualKeyArr = []}) {
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

  let contextQualityElements = (qualKeyArr[0] === undefined) ? undefined :
    map(qualKeyArr, qualKey => {
      if (hasType(qualKey, "array")) {
        let subjKey = objKey;
        let [objKey, relKey] = qualKey; 
        return <QualityElement key={"cq-" + qualKey}
          subjKey={subjKey} relKey={relKey} objKey={objKey}
        />;
      }
      else {
        return <QualityElement key={"cq-" + qualKey}
          qualKey={qualKey} subjKey={objKey}
        />;
      }
    });
  return <div>
    <h4>{"Qualities relevant to the context"}</h4>
    {contextQualityElements}
    <h4>{"Qualities relevant to the entity in general"}</h4>
    <EntityList key="rql"
      objKey={objKey} relKey={relevantQualitiesRel}
      ElementComponent={QualityElement}
    />
  </div>;
}