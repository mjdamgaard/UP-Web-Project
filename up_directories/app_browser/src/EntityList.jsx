
import {fetchList} from "../server/entities.js";
import {fetchEntityID} from '../../semantic_entities/entities.js';


export async function initialize({objKey, relKey}) {
  let [objID, relID] = await Promise.all([
    fetchEntityID(objKey), fetchEntityID(relKey)
  ]);
  let list = await fetchList(objID, relID);
  this.setState({list: list ?? null, objID: objID, relID: relID});
}

export function render({Element, elemProps}) {
  let {list, objID, relID} = this.state;
  if (list === undefined) {
    return <div className="entity-list loading"></div>;
  }
  if (!list) {
    return <div className="entity-list missing"></div>;
  }

  return <div className="entity-list">
    {(list.map(([subjID]) => (
      <Element key={"e-" + subjID} {...elemProps}
        entID={subjID} objID={objID} relID={relID}
      />
    )))}
  </div>;
}