

import * as EntityList from "/1/2/entity_lists/EntityList.jsx"
import * as EntityElement from "../EntityElement.jsx";


export function render({classKey, qualKey}) {
  return <div className="members-page">
    <h4>All</h4>
    <EntityList key="mem-lst"  hideMenu={true}
      ElementComponent={EntityElement}
      classKey={qualKey ? undefined : classKey}
      qualKey={qualKey}
    />
  </div>
}