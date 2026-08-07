
import {fetch} from 'query';
import {fetchEntityID} from '../../semantic_entities/entities.js';


export async function initialize({objKey, relKey}) {
  let [objID, relID] = await Promise.all([
    fetchEntityID(objKey), fetchEntityID(relKey)
  ]);
  let list = await fetch(abs(
    `../server/entity_lists.sm.js/callSMF/fetchList/${objID}/${relID}`
  ));
  this.setState({list: list ?? null});
}

export function render({objKey, Element, elemProps}) {
  let {list} = this.state;
  if (list === undefined) {
    return <div className="entity-list loading"></div>;
  }
  if (!list) {
    return <div className="entity-list missing"></div>;
  }

  return <div className="entity-list">
    {(list.map(([subjID]) => (
      <Element key={subjID} {...elemProps} entID={subjID} objKey={objKey} />
    )))}
  </div>;
}