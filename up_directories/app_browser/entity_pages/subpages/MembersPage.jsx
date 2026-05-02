

import * as EntityList from "../../../entity_browser/entity_lists/EntityList.jsx"
import * as EntityElement from "../../EntityElement.jsx";


export function render({classKey, qualKey}) {
  return <div className="members-page">
    <EntityList key="mem-lst"  hideMenu={true}
      ElementComponent={EntityElement}
      classKey={qualKey ? undefined : classKey}
      qualKey={qualKey}
    />
  </div>
}